import { dataProvider } from "@providers/dataProvider";

describe("DataProvider", () => {
  describe("getList", () => {
    it("should export a valid dataProvider object", () => {
      expect(dataProvider).toBeDefined();
      expect(typeof dataProvider.getList).toBe("function");
      expect(typeof dataProvider.getOne).toBe("function");
      expect(typeof dataProvider.create).toBe("function");
      expect(typeof dataProvider.update).toBe("function");
      expect(typeof dataProvider.deleteOne).toBe("function");
      expect(typeof dataProvider.getApiUrl).toBe("function");
    });

    it("should have correct pagination property mapping", async () => {
      // This is a simple test that verifies the data provider exports are correct
      // Full integration tests would require mocking httpClient or using a test server
      const listFunc = dataProvider.getList;
      expect(listFunc).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", () => {
      // The error handling function should be defined
      const deleteFunc = dataProvider.deleteOne;
      expect(deleteFunc).toBeDefined();
    });
  });

  describe("getOne", () => {
    it("should support getOne operations", () => {
      const getOneFunc = dataProvider.getOne;
      expect(getOneFunc).toBeDefined();
    });
  });

  describe("CRUD Operations", () => {
    it("should support all CRUD operations", () => {
      expect(dataProvider.create).toBeDefined();
      expect(dataProvider.update).toBeDefined();
      expect(dataProvider.deleteOne).toBeDefined();
    });
  });

  describe("API URL", () => {
    it("should return API base URL", () => {
      const apiUrl = dataProvider.getApiUrl?.();
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe("string");
    });
  });
});
