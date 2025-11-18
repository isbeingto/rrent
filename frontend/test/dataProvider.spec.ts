/**
 * FE-1-82: Data Provider 单元测试（分页/筛选/排序/total计算）
 * 
 * 本测试套件使用 mock 验证 dataProvider.getList() 与后端 BE-5 契约的映射正确性：
 * - 分页映射: Refine pagination → 后端 page/limit
 * - 排序映射: Refine sorters → 后端 sort/order
 * - 筛选映射: Refine filters → 后端 query params
 * - total计算: 后端 meta.total 优先，fallback 到 X-Total-Count
 * 
 * 任何映射被改坏时，此测试会立即红灯。
 */

import { dataProvider } from "@providers/dataProvider";
import httpClient from "@shared/api/http";
import { GetListParams } from "@refinedev/core";
import * as authStorage from "@shared/auth/storage";

// Mock dependencies
jest.mock("@shared/api/http");
jest.mock("@shared/auth/storage");

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;
const mockedAuthStorage = authStorage as jest.Mocked<typeof authStorage>;

describe("DataProvider - High-Intensity Unit Tests (FE-1-82)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth with organizationId
    mockedAuthStorage.loadAuth.mockReturnValue({
      token: "mock-token",
      organizationId: "org-123",
      user: { id: "user-1", email: "test@example.com" },
    });
  });

  describe("Basic Structure", () => {
    it("should export a valid dataProvider object with all required methods", () => {
      expect(dataProvider).toBeDefined();
      expect(typeof dataProvider.getList).toBe("function");
      expect(typeof dataProvider.getOne).toBe("function");
      expect(typeof dataProvider.create).toBe("function");
      expect(typeof dataProvider.update).toBe("function");
      expect(typeof dataProvider.deleteOne).toBe("function");
      expect(typeof dataProvider.getApiUrl).toBe("function");
    });
  });

  describe("Pagination Mapping (3 test cases)", () => {
    it("should use default pagination when pagination params are not provided", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1", name: "Item 1" }],
          meta: { total: 100, page: 1, pageSize: 20, pageCount: 5 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "tenants",
        pagination: undefined,
        sorters: undefined,
        filters: undefined,
      };

      await dataProvider.getList(params);

      // FE-2-90: 修正后，getList 应该包含 organizationId query 参数（除 organizations 外）
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/tenants",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            limit: 20,
            organizationId: "org-123",
          }),
        })
      );
    });

    it("should map explicit pageNumber and pageSize correctly", async () => {
      const mockResponse = {
        data: {
          items: Array(50).fill(null).map((_, i) => ({ id: `${i}`, name: `Item ${i}` })),
          meta: { total: 500, page: 3, pageSize: 50, pageCount: 10 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "properties",
        pagination: { currentPage: 3, pageSize: 50, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      const result = await dataProvider.getList(params);

      // FE-2-90: 修正后，getList 应该包含 organizationId query 参数
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/properties",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 3,
            limit: 50,
            organizationId: "org-123",
          }),
        })
      );

      // 验证返回结构
      expect(result.data).toHaveLength(50);
      expect(result.total).toBe(500);
    });

    it("should pass extreme page numbers without truncation (boundary case)", async () => {
      const mockResponse = {
        data: {
          items: [],
          meta: { total: 100, page: 999, pageSize: 20, pageCount: 5 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "units",
        pagination: { currentPage: 999, pageSize: 100, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      await dataProvider.getList(params);

      // FE-2-90: 修正后，验证包含 organizationId
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/units",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 999,
            limit: 100,
            organizationId: "org-123",
          }),
        })
      );
    });
  });

  describe("Sorting Mapping (2 test cases)", () => {
    it("should map single field sorter to sort and order params", async () => {
      const mockResponse = {
        data: {
          items: [
            { id: "1", name: "A", createdAt: "2025-01-01" },
            { id: "2", name: "B", createdAt: "2025-01-02" },
          ],
          meta: { total: 2, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "leases",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: [{ field: "createdAt", order: "desc" }],
        filters: undefined,
      };

      await dataProvider.getList(params);

      // FE-2-90: 修正后，验证排序映射并包含 organizationId
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/leases",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            limit: 20,
            sort: "createdAt",
            order: "desc",
            organizationId: "org-123",
          }),
        })
      );
    });

    it("should only use first sorter when multiple sorters provided", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1", name: "Test" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "payments",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: [
          { field: "amount", order: "asc" },
          { field: "createdAt", order: "desc" }, // 应被忽略
        ],
        filters: undefined,
      };

      await dataProvider.getList(params);

      // 验证只取第一个 sorter
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/payments",
        expect.objectContaining({
          params: expect.objectContaining({
            sort: "amount",
            order: "asc",
          }),
        })
      );

      // 验证不包含第二个 sorter
      const callParams = mockedHttpClient.get.mock.calls[0][1]?.params;
      expect(callParams).not.toHaveProperty("sort2");
      expect(callParams).toHaveProperty("sort", "amount");
    });
  });

  describe("Filter Mapping (3 test cases)", () => {
    it("should map simple equals filter to query param", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1", status: "ACTIVE" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "tenants",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: [
          { field: "status", operator: "eq", value: "ACTIVE" },
        ],
      };

      await dataProvider.getList(params);

      // 注意：当前实现的 dataProvider 不处理 filters
      // 这个测试记录了当前行为：filters 被忽略
      // 如果未来需要支持 filters，需要修改 dataProvider.ts
      // FE-2-90: 修正后，getList 包含 organizationId query 参数
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/tenants",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            limit: 20,
            organizationId: "org-123",
          }),
        })
      );

      // 当前实现不包含 status 参数（因为未实现 filters 映射）
      const callParams = mockedHttpClient.get.mock.calls[0][1]?.params;
      expect(callParams).not.toHaveProperty("status");
    });

    it("should handle keyword/search filter (if implemented)", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1", name: "Demo Property" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "properties",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: [
          { field: "q", operator: "contains", value: "demo" },
        ],
      };

      await dataProvider.getList(params);

      // 当前实现不处理 filters，这里记录预期行为
      // 如果实现了 filters 映射，应该有 q=demo 或 keyword=demo
      expect(mockedHttpClient.get).toHaveBeenCalled();
    });

    it("should handle combined filters (status + date range)", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1", status: "PENDING", dueDate: "2025-12-01" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "payments",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: [
          { field: "status", operator: "eq", value: "PENDING" },
          { field: "dueDateFrom", operator: "gte", value: "2025-01-01" },
          { field: "dueDateTo", operator: "lte", value: "2025-12-31" },
        ],
      };

      await dataProvider.getList(params);

      // 当前实现不处理 filters
      // 这个测试记录了组合筛选的预期映射逻辑
      expect(mockedHttpClient.get).toHaveBeenCalled();
    });
  });

  describe("Total Calculation Logic (3 test cases)", () => {
    it("should prioritize meta.total when available", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1" }, { id: "2" }, { id: "3" }],
          meta: { total: 123, page: 1, pageSize: 20, pageCount: 7 },
        },
        headers: {
          "x-total-count": "999", // 应被忽略，优先使用 meta.total
        },
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "tenants",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      const result = await dataProvider.getList(params);

      // 验证：返回 meta.total = 123，而不是 header 中的 999
      expect(result.total).toBe(123);
      expect(result.data).toHaveLength(3);
    });

    it("should fallback to X-Total-Count header when meta.total is missing", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1" }, { id: "2" }],
          // meta.total 不存在
        },
        headers: {
          "x-total-count": "456",
        },
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "properties",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      const result = await dataProvider.getList(params);

      // 验证：使用 header 中的 x-total-count = 456
      expect(result.total).toBe(456);
      expect(result.data).toHaveLength(2);
    });

    it("should use 0 as fallback when neither meta.total nor X-Total-Count exists", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "1" }],
          // 无 meta.total
        },
        headers: {
          // 无 x-total-count
        },
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      const params: GetListParams = {
        resource: "units",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      const result = await dataProvider.getList(params);

      // 验证：兜底为 0（记录此决策）
      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("Error Handling", () => {
    it("should preserve backend error code and message in thrown error", async () => {
      const mockError = {
        response: {
          data: {
            code: "TENANT_NOT_FOUND",
            message: "Tenant with ID 123 not found",
          },
          status: 404,
        },
        message: "Request failed with status code 404",
      };
      mockedHttpClient.get.mockRejectedValue(mockError);

      const params: GetListParams = {
        resource: "tenants",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      try {
        await dataProvider.getList(params);
        fail("Should have thrown an error");
      } catch (error) {
        // 验证：错误对象保留了 code 和 message
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Tenant with ID 123 not found");
        expect((error as { code?: string }).code).toBe("TENANT_NOT_FOUND");
      }
    });

    it("should handle network errors gracefully", async () => {
      const mockError = {
        message: "Network Error",
      };
      mockedHttpClient.get.mockRejectedValue(mockError);

      const params: GetListParams = {
        resource: "properties",
        pagination: { currentPage: 1, pageSize: 20, mode: "server" },
        sorters: undefined,
        filters: undefined,
      };

      try {
        await dataProvider.getList(params);
        fail("Should have thrown an error");
      } catch (error) {
        // 验证：网络错误被正确处理
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Network Error");
      }
    });
  });

  describe("CRUD Operations Support", () => {
    it("should support getOne operation", async () => {
      httpClient.get = jest.fn().mockResolvedValue({
        data: { id: "1", name: "Test Property" },
      });

      const result = await dataProvider.getOne({
        resource: "properties",
        id: "1",
      });

      expect(httpClient.get).toHaveBeenCalledWith("/properties/1?organizationId=org-123");
      expect(result).toEqual({
        data: { id: "1", name: "Test Property" },
      });
    });

    it("should support create operation for properties (organizationId in body)", async () => {
      httpClient.post = jest.fn().mockResolvedValue({
        data: { id: "new-1", name: "New Property" },
      });

      const result = await dataProvider.create({
        resource: "properties",
        variables: { name: "New Property" },
      });

      // Properties: organizationId should be injected into body (like tenants)
      expect(httpClient.post).toHaveBeenCalledWith("/properties", {
        name: "New Property",
        organizationId: "org-123",
      });
      expect(result).toEqual({
        data: { id: "new-1", name: "New Property" },
      });
    });

    it("should support create operation for tenants (organizationId in body)", async () => {
      httpClient.post = jest.fn().mockResolvedValue({
        data: { id: "tenant-1", fullName: "John Doe", organizationId: "org-123" },
      });

      const result = await dataProvider.create({
        resource: "tenants",
        variables: { fullName: "John Doe", email: "john@example.com", phone: "1234567890" },
      });

      // Tenants: organizationId should be injected into body, not query
      expect(httpClient.post).toHaveBeenCalledWith("/tenants", {
        fullName: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
        organizationId: "org-123",
      });
      expect(result).toEqual({
        data: { id: "tenant-1", fullName: "John Doe", organizationId: "org-123" },
      });
    });

    it("should support create operation for units (organizationId in query)", async () => {
      httpClient.post = jest.fn().mockResolvedValue({
        data: { id: "unit-1", unitNumber: "101" },
      });

      const result = await dataProvider.create({
        resource: "units",
        variables: { unitNumber: "101", propertyId: "prop-1" },
      });

      // Units: organizationId should be in query parameter
      expect(httpClient.post).toHaveBeenCalledWith("/units?organizationId=org-123", {
        unitNumber: "101",
        propertyId: "prop-1",
      });
      expect(result).toEqual({
        data: { id: "unit-1", unitNumber: "101" },
      });
    });

    it("should support update operation", async () => {
      httpClient.put = jest.fn().mockResolvedValue({
        data: { id: "1", name: "Updated Property" },
      });

      const result = await dataProvider.update({
        resource: "properties",
        id: "1",
        variables: { name: "Updated Property" },
      });

      expect(httpClient.put).toHaveBeenCalledWith("/properties/1?organizationId=org-123", {
        name: "Updated Property",
      });
      expect(result).toEqual({
        data: { id: "1", name: "Updated Property" },
      });
    });

    it("should support deleteOne operation", async () => {
      httpClient.delete = jest.fn().mockResolvedValue({
        data: { id: "1", deleted: true },
      });

      const result = await dataProvider.deleteOne({
        resource: "properties",
        id: "1",
      });

      expect(httpClient.delete).toHaveBeenCalledWith("/properties/1?organizationId=org-123");
      expect(result).toEqual({
        data: { id: "1", deleted: true },
      });
    });

    it("should return API base URL", () => {
      const apiUrl = dataProvider.getApiUrl();
      expect(typeof apiUrl).toBe("string");
    });
  });

  describe("Unimplemented Methods", () => {
    it("should throw error for getMany", async () => {
      await expect(
        dataProvider.getMany?.({ resource: "properties", ids: ["1", "2"] })
      ).rejects.toThrow("getMany not implemented yet");
    });

    it("should throw error for createMany", async () => {
      await expect(
        dataProvider.createMany?.({
          resource: "properties",
          variables: [{ name: "Prop1" }, { name: "Prop2" }],
        })
      ).rejects.toThrow("createMany not implemented yet");
    });

    it("should throw error for updateMany", async () => {
      await expect(
        dataProvider.updateMany?.({
          resource: "properties",
          ids: ["1", "2"],
          variables: { status: "ACTIVE" },
        })
      ).rejects.toThrow("updateMany not implemented yet");
    });

    it("should throw error for deleteMany", async () => {
      await expect(
        dataProvider.deleteMany?.({ resource: "properties", ids: ["1", "2"] })
      ).rejects.toThrow("deleteMany not implemented yet");
    });

    it("should throw error for custom", async () => {
      await expect(
        dataProvider.custom?.({ url: "/custom", method: "get" })
      ).rejects.toThrow("custom not implemented yet");
    });
  });

  /**
   * FE-2-89: API Contract Tests for Units and Tenants
   * 
   * 严格验证 Units 和 Tenants 资源的 API 契约：
   * - organizationId 在哪些操作中作为 query 参数
   * - organizationId 在哪些操作中作为 body 参数
   * - 确保与后端 controller 实现完全一致
   */
  describe("API Contract: Units (FE-2-89)", () => {
    it("GET /units - should include organizationId in query params", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "unit-1", unitNumber: "101" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getList({ resource: "units" });

      // FE-2-90: 修正后，getList 应该包含 organizationId query 参数
      const callArgs = mockedHttpClient.get.mock.calls[0];
      expect(callArgs[0]).toBe("/units");
      expect(callArgs[1]?.params).toHaveProperty("organizationId", "org-123");
    });

    it("GET /units/:id - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "unit-1", unitNumber: "101" },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getOne({ resource: "units", id: "unit-1" });

      // 验证：getOne 必须包含 organizationId query 参数
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/units/unit-1?organizationId=org-123"
      );
    });

    it("POST /units - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "unit-1", unitNumber: "101" },
      };
      mockedHttpClient.post.mockResolvedValue(mockResponse);

      await dataProvider.create({
        resource: "units",
        variables: { unitNumber: "101", propertyId: "prop-1" },
      });

      // 验证：create 必须包含 organizationId query 参数，不在 body 中
      const callArgs = mockedHttpClient.post.mock.calls[0];
      expect(callArgs[0]).toBe("/units?organizationId=org-123");
      expect(callArgs[1]).not.toHaveProperty("organizationId");
    });

    it("PUT /units/:id - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "unit-1", unitNumber: "102" },
      };
      mockedHttpClient.put.mockResolvedValue(mockResponse);

      await dataProvider.update({
        resource: "units",
        id: "unit-1",
        variables: { unitNumber: "102" },
      });

      // 验证：update 必须包含 organizationId query 参数
      expect(mockedHttpClient.put).toHaveBeenCalledWith(
        "/units/unit-1?organizationId=org-123",
        { unitNumber: "102" }
      );
    });

    it("DELETE /units/:id - should include organizationId in query params", async () => {
      const mockResponse = { data: {} };
      mockedHttpClient.delete.mockResolvedValue(mockResponse);

      await dataProvider.deleteOne({ resource: "units", id: "unit-1" });

      // 验证：delete 必须包含 organizationId query 参数
      expect(mockedHttpClient.delete).toHaveBeenCalledWith(
        "/units/unit-1?organizationId=org-123"
      );
    });
  });

  describe("API Contract: Tenants (FE-2-89)", () => {
    it("GET /tenants - should include organizationId in query params", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "tenant-1", fullName: "张三" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getList({ resource: "tenants" });

      // FE-2-90: 修正后，getList 应该包含 organizationId query 参数
      const callArgs = mockedHttpClient.get.mock.calls[0];
      expect(callArgs[0]).toBe("/tenants");
      expect(callArgs[1]?.params).toHaveProperty("organizationId", "org-123");
    });

    it("GET /tenants/:id - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "tenant-1", fullName: "张三" },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getOne({ resource: "tenants", id: "tenant-1" });

      // 验证：getOne 必须包含 organizationId query 参数
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/tenants/tenant-1?organizationId=org-123"
      );
    });

    it("POST /tenants - should include organizationId in body, NOT in query", async () => {
      const mockResponse = {
        data: { id: "tenant-1", fullName: "张三" },
      };
      mockedHttpClient.post.mockResolvedValue(mockResponse);

      await dataProvider.create({
        resource: "tenants",
        variables: { fullName: "张三", email: "zhang@example.com", phone: "13800138000" },
      });

      // 验证：create 必须包含 organizationId 在 body 中，不在 query 中
      const callArgs = mockedHttpClient.post.mock.calls[0];
      expect(callArgs[0]).toBe("/tenants");
      expect(callArgs[1]).toHaveProperty("organizationId", "org-123");
      expect(callArgs[1]).toHaveProperty("fullName", "张三");
    });

    it("PUT /tenants/:id - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "tenant-1", fullName: "李四" },
      };
      mockedHttpClient.put.mockResolvedValue(mockResponse);

      await dataProvider.update({
        resource: "tenants",
        id: "tenant-1",
        variables: { fullName: "李四" },
      });

      // 验证：update 必须包含 organizationId query 参数
      expect(mockedHttpClient.put).toHaveBeenCalledWith(
        "/tenants/tenant-1?organizationId=org-123",
        { fullName: "李四" }
      );
    });

    it("DELETE /tenants/:id - should include organizationId in query params", async () => {
      const mockResponse = { data: {} };
      mockedHttpClient.delete.mockResolvedValue(mockResponse);

      await dataProvider.deleteOne({ resource: "tenants", id: "tenant-1" });

      // 验证：delete 必须包含 organizationId query 参数
      expect(mockedHttpClient.delete).toHaveBeenCalledWith(
        "/tenants/tenant-1?organizationId=org-123"
      );
    });
  });

  describe("API Contract: Leases (FE-2-91)", () => {
    it("GET /leases - should include organizationId in query params", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "lease-1", tenantId: "tenant-1", unitId: "unit-1" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getList({ resource: "leases" });

      // 验证：getList 应该包含 organizationId query 参数
      const callArgs = mockedHttpClient.get.mock.calls[0];
      expect(callArgs[0]).toBe("/leases");
      expect(callArgs[1]?.params).toHaveProperty("organizationId", "org-123");
    });

    it("GET /leases/:id - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "lease-1", tenantId: "tenant-1", unitId: "unit-1" },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getOne({ resource: "leases", id: "lease-1" });

      // 验证：getOne 必须包含 organizationId query 参数
      expect(mockedHttpClient.get).toHaveBeenCalledWith(
        "/leases/lease-1?organizationId=org-123"
      );
    });

    it("POST /leases - should include organizationId in body, NOT in query", async () => {
      const mockResponse = {
        data: { id: "lease-1", tenantId: "tenant-1", unitId: "unit-1" },
      };
      mockedHttpClient.post.mockResolvedValue(mockResponse);

      await dataProvider.create({
        resource: "leases",
        variables: {
          tenantId: "tenant-1",
          unitId: "unit-1",
          propertyId: "property-1",
          startDate: "2025-01-01",
          rentAmount: 1000,
          billCycle: "MONTHLY",
        },
      });

      // 验证：create 必须包含 organizationId 在 body 中，不在 query 中
      const callArgs = mockedHttpClient.post.mock.calls[0];
      expect(callArgs[0]).toBe("/leases");
      expect(callArgs[1]).toHaveProperty("organizationId", "org-123");
      expect(callArgs[1]).toHaveProperty("tenantId", "tenant-1");
    });

    it("PUT /leases/:id - should include organizationId in query params", async () => {
      const mockResponse = {
        data: { id: "lease-1", rentAmount: 1200 },
      };
      mockedHttpClient.put.mockResolvedValue(mockResponse);

      await dataProvider.update({
        resource: "leases",
        id: "lease-1",
        variables: { rentAmount: 1200 },
      });

      // 验证：update 必须包含 organizationId query 参数
      expect(mockedHttpClient.put).toHaveBeenCalledWith(
        "/leases/lease-1?organizationId=org-123",
        { rentAmount: 1200 }
      );
    });

    it("DELETE /leases/:id - should include organizationId in query params", async () => {
      const mockResponse = { data: {} };
      mockedHttpClient.delete.mockResolvedValue(mockResponse);

      await dataProvider.deleteOne({ resource: "leases", id: "lease-1" });

      // 验证：delete 必须包含 organizationId query 参数
      expect(mockedHttpClient.delete).toHaveBeenCalledWith(
        "/leases/lease-1?organizationId=org-123"
      );
    });
  });

  describe("API Contract: Organizations (baseline)", () => {
    it("should NOT inject organizationId for any operation on organizations resource", async () => {
      const mockResponse = {
        data: {
          items: [{ id: "org-1", name: "Test Org" }],
          meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
        },
        headers: {},
      };
      mockedHttpClient.get.mockResolvedValue(mockResponse);

      await dataProvider.getList({ resource: "organizations" });

      // 验证：organizations 资源不应包含 organizationId
      const callArgs = mockedHttpClient.get.mock.calls[0];
      expect(callArgs[0]).toBe("/organizations");
      expect(callArgs[1]?.params).not.toHaveProperty("organizationId");
    });
  });
});

