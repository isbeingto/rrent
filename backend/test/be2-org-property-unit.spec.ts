/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, UnitStatus } from "@prisma/client";
import { OrganizationService } from "../src/modules/organization/organization.service";
import { PropertyService } from "../src/modules/property/property.service";
import { UnitService } from "../src/modules/unit/unit.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("BE-2-30: Organization, Property, Unit Services", () => {
  let organizationService: OrganizationService;
  let propertyService: PropertyService;
  let unitService: UnitService;
  let mockPrisma: any;

  beforeEach(async () => {
    // Create mock PrismaService
    mockPrisma = {
      organization: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      property: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      unit: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        PropertyService,
        UnitService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    organizationService = module.get<OrganizationService>(OrganizationService);
    propertyService = module.get<PropertyService>(PropertyService);
    unitService = module.get<UnitService>(UnitService);
  });

  describe("OrganizationService", () => {
    describe("create", () => {
      it("should create an organization", async () => {
        const dto = {
          name: "Test Organization",
          code: "TEST_ORG",
          description: "Test description",
          timezone: "Asia/Shanghai",
        };

        const mockOrganization = {
          id: "org-123",
          name: "Test Organization",
          code: "TEST_ORG",
          description: "Test description",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.organization.create.mockResolvedValue(mockOrganization);

        const result = await organizationService.create(dto);

        expect(result).toEqual(mockOrganization);
        expect(mockPrisma.organization.create).toHaveBeenCalledWith({
          data: {
            name: "Test Organization",
            code: "TEST_ORG",
            description: "Test description",
            timezone: "Asia/Shanghai",
            isActive: true,
          },
        });
      });

      it("should throw ConflictException when code is not unique (P2002)", async () => {
        const dto = {
          name: "Test Organization",
          code: "DUPLICATE_CODE",
          description: "Test description",
          timezone: "Asia/Shanghai",
        };

        const error = new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the fields: `code`",
          { code: "P2002", clientVersion: "1.0.0" },
        );

        mockPrisma.organization.create.mockRejectedValue(error);

        await expect(organizationService.create(dto)).rejects.toThrow(
          ConflictException,
        );
        await expect(organizationService.create(dto)).rejects.toThrow(
          "already exists",
        );
      });

      it("should use default timezone if not provided", async () => {
        const dto = {
          name: "Test Organization",
          code: "TEST_ORG_2",
          description: "Test description",
        };

        const mockOrganization = {
          id: "org-124",
          name: "Test Organization",
          code: "TEST_ORG_2",
          description: "Test description",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.organization.create.mockResolvedValue(mockOrganization);

        await organizationService.create(dto as any);

        expect(mockPrisma.organization.create).toHaveBeenCalledWith({
          data: {
            name: "Test Organization",
            code: "TEST_ORG_2",
            description: "Test description",
            timezone: "Asia/Shanghai",
            isActive: true,
          },
        });
      });
    });

    describe("findById", () => {
      it("should find an organization by id", async () => {
        const mockOrganization = {
          id: "org-123",
          name: "Test Organization",
          code: "TEST_ORG",
          description: "Test description",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);

        const result = await organizationService.findById("org-123");

        expect(result).toEqual(mockOrganization);
        expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
          where: { id: "org-123" },
        });
      });

      it("should throw NotFoundException when organization does not exist", async () => {
        mockPrisma.organization.findUnique.mockResolvedValue(null);

        await expect(organizationService.findById("org-999")).rejects.toThrow(
          NotFoundException,
        );
        await expect(organizationService.findById("org-999")).rejects.toThrow(
          "not found",
        );
      });
    });

    describe("findMany", () => {
      it("should return paginated organizations", async () => {
        const mockOrganizations = [
          {
            id: "org-123",
            name: "Test Organization 1",
            code: "TEST_ORG_1",
            description: "Test description 1",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "org-124",
            name: "Test Organization 2",
            code: "TEST_ORG_2",
            description: "Test description 2",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([mockOrganizations, 2]);

        const result = await organizationService.findMany({
          page: 1,
          limit: 20,
        });

        expect(result.items).toEqual(mockOrganizations);
        expect(result.meta).toEqual({
          total: 2,
          page: 1,
          limit: 20,
          pageCount: 1,
        });
      });

      it("should filter organizations by keyword", async () => {
        const mockOrganizations = [
          {
            id: "org-123",
            name: "Test Organization",
            code: "TEST_ORG",
            description: "Test description",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([mockOrganizations, 1]);

        const result = await organizationService.findMany({
          page: 1,
          limit: 20,
          keyword: "Test",
        });

        expect(result.items).toHaveLength(1);
        expect(result.meta.total).toBe(1);
      });

      it("should return empty results when no organizations match", async () => {
        mockPrisma.$transaction.mockResolvedValue([[], 0]);

        const result = await organizationService.findMany({
          page: 1,
          limit: 20,
          keyword: "Nonexistent",
        });

        expect(result.items).toEqual([]);
        expect(result.meta.total).toBe(0);
        expect(result.meta.pageCount).toBe(1);
      });

      it("should calculate correct pageCount", async () => {
        mockPrisma.$transaction.mockResolvedValue([[], 100]);

        const result = await organizationService.findMany({
          page: 1,
          limit: 20,
        });

        expect(result.meta.pageCount).toBe(5);
      });
    });
  });

  describe("PropertyService", () => {
    describe("create", () => {
      it("should validate organization exists before creating property", async () => {
        const dto = {
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
        };

        mockPrisma.organization.findUnique.mockResolvedValue(null);

        await expect(propertyService.create(dto as any)).rejects.toThrow(
          NotFoundException,
        );
        await expect(propertyService.create(dto as any)).rejects.toThrow(
          "Organization",
        );
      });

      it("should create property when organization exists", async () => {
        const dto = {
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
        };

        const mockOrganization = {
          id: "org-123",
          name: "Test Organization",
          code: "TEST_ORG",
          description: "Test description",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockProperty = {
          id: "prop-123",
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
        mockPrisma.property.create.mockResolvedValue(mockProperty);

        const result = await propertyService.create(dto as any);

        expect(result).toEqual(mockProperty);
        expect(mockPrisma.property.create).toHaveBeenCalled();
      });

      it("should throw ConflictException when code is not unique within organization (P2002)", async () => {
        const dto = {
          organizationId: "org-123",
          name: "Test Property",
          code: "DUPLICATE_PROP",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
        };

        const mockOrganization = {
          id: "org-123",
          name: "Test Organization",
          code: "TEST_ORG",
          description: "Test description",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const error = new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed",
          { code: "P2002", clientVersion: "1.0.0" },
        );

        mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
        mockPrisma.property.create.mockRejectedValue(error);

        await expect(propertyService.create(dto as any)).rejects.toThrow(
          ConflictException,
        );
        await expect(propertyService.create(dto as any)).rejects.toThrow(
          "already exists",
        );
      });
    });

    describe("findById", () => {
      it("should find property only if it belongs to organization", async () => {
        const mockProperty = {
          id: "prop-123",
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.property.findFirst.mockResolvedValue(mockProperty);

        const result = await propertyService.findById("prop-123", "org-123");

        expect(result).toEqual(mockProperty);
        expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
          where: {
            id: "prop-123",
            organizationId: "org-123",
          },
        });
      });

      it("should throw NotFoundException when property does not belong to organization", async () => {
        mockPrisma.property.findFirst.mockResolvedValue(null);

        await expect(
          propertyService.findById("prop-999", "org-123"),
        ).rejects.toThrow(NotFoundException);
      });

      it("should enforce org-scoped isolation - different org cannot access property", async () => {
        mockPrisma.property.findFirst.mockResolvedValue(null);

        await expect(
          propertyService.findById("prop-123", "org-999"),
        ).rejects.toThrow(NotFoundException);

        expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
          where: {
            id: "prop-123",
            organizationId: "org-999",
          },
        });
      });
    });

    describe("findMany", () => {
      it("should filter properties by city", async () => {
        const mockProperties = [
          {
            id: "prop-123",
            organizationId: "org-123",
            name: "Beijing Property",
            code: "PROP_001",
            description: "Test property",
            addressLine1: "123 Main St",
            addressLine2: null,
            city: "Beijing",
            state: "Beijing",
            postalCode: "100000",
            country: "CN",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([mockProperties, 1]);

        const result = await propertyService.findMany({
          organizationId: "org-123",
          city: "Beijing",
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].city).toBe("Beijing");
      });

      it("should return correct pagination structure", async () => {
        const mockProperties = [
          {
            id: "prop-123",
            organizationId: "org-123",
            name: "Test Property",
            code: "PROP_001",
            description: "Test property",
            addressLine1: "123 Main St",
            addressLine2: null,
            city: "Beijing",
            state: "Beijing",
            postalCode: "100000",
            country: "CN",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([mockProperties, 1]);

        const result = await propertyService.findMany({
          organizationId: "org-123",
          page: 1,
          limit: 20,
        });

        expect(result).toHaveProperty("items");
        expect(result).toHaveProperty("meta");
        expect(result.meta).toHaveProperty("total");
        expect(result.meta).toHaveProperty("page");
        expect(result.meta).toHaveProperty("limit");
        expect(result.meta).toHaveProperty("pageCount");
      });

      it("should return empty results when no properties match", async () => {
        mockPrisma.$transaction.mockResolvedValue([[], 0]);

        const result = await propertyService.findMany({
          organizationId: "org-123",
          city: "NonexistentCity",
          page: 1,
          limit: 20,
        });

        expect(result.items).toEqual([]);
        expect(result.meta.total).toBe(0);
      });
    });
  });

  describe("UnitService", () => {
    describe("create", () => {
      it("should validate property exists and belongs to organization", async () => {
        const dto = {
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "101",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
        };

        mockPrisma.property.findFirst.mockResolvedValue(null);

        await expect(unitService.create(dto as any, "org-123")).rejects.toThrow(
          NotFoundException,
        );
        await expect(unitService.create(dto as any, "org-123")).rejects.toThrow(
          "Property",
        );
      });

      it("should create unit when property exists and belongs to organization", async () => {
        const dto = {
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "101",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
        };

        const mockProperty = {
          id: "prop-123",
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const mockUnit = {
          id: "unit-123",
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "101",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
        mockPrisma.unit.create.mockResolvedValue(mockUnit);

        const result = await unitService.create(dto as any, "org-123");

        expect(result).toEqual(mockUnit);
        expect(mockPrisma.unit.create).toHaveBeenCalled();
      });

      it("should throw ConflictException when unitNumber is not unique (P2002)", async () => {
        const dto = {
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "DUPLICATE_UNIT",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
        };

        const mockProperty = {
          id: "prop-123",
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const error = new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed",
          { code: "P2002", clientVersion: "1.0.0" },
        );

        mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
        mockPrisma.unit.create.mockRejectedValue(error);

        await expect(unitService.create(dto as any, "org-123")).rejects.toThrow(
          ConflictException,
        );
        await expect(unitService.create(dto as any, "org-123")).rejects.toThrow(
          "already exists",
        );
      });
    });

    describe("findById", () => {
      it("should find unit only if property belongs to organization", async () => {
        const mockUnit = {
          id: "unit-123",
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "101",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          property: {
            id: "prop-123",
            organizationId: "org-123",
            name: "Test Property",
            code: "PROP_001",
            description: "Test property",
            addressLine1: "123 Main St",
            addressLine2: null,
            city: "Beijing",
            state: "Beijing",
            postalCode: "100000",
            country: "CN",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };

        mockPrisma.unit.findFirst.mockResolvedValue(mockUnit);

        const result = await unitService.findById("unit-123", "org-123");

        expect(result).toEqual(mockUnit);
        expect(mockPrisma.unit.findFirst).toHaveBeenCalledWith({
          where: {
            id: "unit-123",
            property: {
              organizationId: "org-123",
            },
          },
          include: {
            property: true,
          },
        });
      });

      it("should enforce org-scoped isolation - different org cannot access unit", async () => {
        mockPrisma.unit.findFirst.mockResolvedValue(null);

        await expect(
          unitService.findById("unit-123", "org-999"),
        ).rejects.toThrow(NotFoundException);

        expect(mockPrisma.unit.findFirst).toHaveBeenCalledWith({
          where: {
            id: "unit-123",
            property: {
              organizationId: "org-999",
            },
          },
          include: {
            property: true,
          },
        });
      });

      it("should throw NotFoundException when unit does not exist", async () => {
        mockPrisma.unit.findFirst.mockResolvedValue(null);

        await expect(
          unitService.findById("unit-999", "org-123"),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe("update", () => {
      it("should update unit with org-scoped isolation", async () => {
        const mockUnit = {
          id: "unit-123",
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "101",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          property: {
            id: "prop-123",
            organizationId: "org-123",
            name: "Test Property",
            code: "PROP_001",
            description: "Test property",
            addressLine1: "123 Main St",
            addressLine2: null,
            city: "Beijing",
            state: "Beijing",
            postalCode: "100000",
            country: "CN",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };

        const updatedUnit = {
          ...mockUnit,
          status: UnitStatus.OCCUPIED,
          bedrooms: 3,
        };

        mockPrisma.unit.findFirst.mockResolvedValue(mockUnit);
        mockPrisma.unit.update.mockResolvedValue(updatedUnit);

        const result = await unitService.update("unit-123", "org-123", {
          status: UnitStatus.OCCUPIED,
          bedrooms: 3,
        } as any);

        expect(result.status).toBe(UnitStatus.OCCUPIED);
        expect(mockPrisma.unit.update).toHaveBeenCalled();
      });

      it("should throw NotFoundException when updating unit in different organization", async () => {
        mockPrisma.unit.findFirst.mockResolvedValue(null);

        await expect(
          unitService.update("unit-123", "org-999", {} as any),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe("remove", () => {
      it("should remove unit with org-scoped isolation", async () => {
        const mockUnit = {
          id: "unit-123",
          propertyId: "prop-123",
          name: "Unit 101",
          unitNumber: "101",
          floor: 1,
          bedrooms: 2,
          bathrooms: 1,
          areaSqm: 100,
          status: UnitStatus.VACANT,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          property: {
            id: "prop-123",
            organizationId: "org-123",
            name: "Test Property",
            code: "PROP_001",
            description: "Test property",
            addressLine1: "123 Main St",
            addressLine2: null,
            city: "Beijing",
            state: "Beijing",
            postalCode: "100000",
            country: "CN",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };

        mockPrisma.unit.findFirst.mockResolvedValue(mockUnit);
        mockPrisma.unit.delete.mockResolvedValue(mockUnit);

        await unitService.remove("unit-123", "org-123");

        expect(mockPrisma.unit.delete).toHaveBeenCalledWith({
          where: { id: "unit-123" },
        });
      });

      it("should throw NotFoundException when removing unit from different organization", async () => {
        mockPrisma.unit.findFirst.mockResolvedValue(null);

        await expect(unitService.remove("unit-123", "org-999")).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe("findMany", () => {
      it("should filter units by status", async () => {
        const mockUnits = [
          {
            id: "unit-123",
            propertyId: "prop-123",
            name: "Unit 101",
            unitNumber: "101",
            floor: 1,
            bedrooms: 2,
            bathrooms: 1,
            areaSqm: 100,
            status: UnitStatus.VACANT,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([mockUnits, 1]);

        const result = await unitService.findMany({
          organizationId: "org-123",
          status: UnitStatus.VACANT,
          page: 1,
          limit: 20,
        });

        expect(result.items).toHaveLength(1);
        expect(result.items[0].status).toBe(UnitStatus.VACANT);
      });

      it("should return correct pagination structure for units", async () => {
        const mockUnits = [
          {
            id: "unit-123",
            propertyId: "prop-123",
            name: "Unit 101",
            unitNumber: "101",
            floor: 1,
            bedrooms: 2,
            bathrooms: 1,
            areaSqm: 100,
            status: UnitStatus.VACANT,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockPrisma.$transaction.mockResolvedValue([mockUnits, 1]);

        const result = await unitService.findMany({
          organizationId: "org-123",
          page: 1,
          limit: 20,
        });

        expect(result).toHaveProperty("items");
        expect(result).toHaveProperty("meta");
        expect(result.meta).toHaveProperty("total");
        expect(result.meta).toHaveProperty("page");
        expect(result.meta).toHaveProperty("limit");
        expect(result.meta).toHaveProperty("pageCount");
      });

      it("should return empty results when no units match", async () => {
        mockPrisma.$transaction.mockResolvedValue([[], 0]);

        const result = await unitService.findMany({
          organizationId: "org-123",
          status: UnitStatus.VACANT,
          page: 1,
          limit: 20,
        });

        expect(result.items).toEqual([]);
        expect(result.meta.total).toBe(0);
      });
    });
  });

  describe("Error Handling - Prisma Errors", () => {
    it("should convert P2002 error to ConflictException in OrganizationService", async () => {
      const dto = {
        name: "Test Organization",
        code: "DUPLICATE",
        description: "Test",
        timezone: "Asia/Shanghai",
      };

      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: `code`",
        { code: "P2002", clientVersion: "1.0.0" },
      );

      mockPrisma.organization.create.mockRejectedValue(error);

      await expect(organizationService.create(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should convert P2025 error to NotFoundException in PropertyService", async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "An operation failed because it depends on one or more records that were required but not found.",
        { code: "P2025", clientVersion: "1.0.0" },
      );

      mockPrisma.property.findFirst.mockResolvedValue({
        id: "prop-123",
        organizationId: "org-123",
        name: "Test Property",
        code: "PROP_001",
        description: "Test property",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "Beijing",
        state: "Beijing",
        postalCode: "100000",
        country: "CN",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.property.update.mockRejectedValue(error);

      await expect(
        propertyService.update("prop-123", "org-123", {
          name: "Updated Property",
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it("should convert P2025 error to NotFoundException in UnitService", async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "An operation failed because it depends on one or more records that were required but not found.",
        { code: "P2025", clientVersion: "1.0.0" },
      );

      const mockUnit = {
        id: "unit-123",
        propertyId: "prop-123",
        name: "Unit 101",
        unitNumber: "101",
        floor: 1,
        bedrooms: 2,
        bathrooms: 1,
        areaSqm: 100,
        status: UnitStatus.VACANT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: {
          id: "prop-123",
          organizationId: "org-123",
          name: "Test Property",
          code: "PROP_001",
          description: "Test property",
          addressLine1: "123 Main St",
          addressLine2: null,
          city: "Beijing",
          state: "Beijing",
          postalCode: "100000",
          country: "CN",
          timezone: "Asia/Shanghai",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrisma.unit.findFirst.mockResolvedValue(mockUnit);
      mockPrisma.unit.update.mockRejectedValue(error);

      await expect(
        unitService.update("unit-123", "org-123", {
          status: UnitStatus.OCCUPIED,
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("Pagination Tests", () => {
    it("should calculate pageCount correctly for organizations", async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 100]);

      const result = await organizationService.findMany({
        page: 1,
        limit: 10,
      });

      expect(result.meta.pageCount).toBe(10);
    });

    it("should handle single page results", async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [
          {
            id: "org-123",
            name: "Test Organization",
            code: "TEST_ORG",
            description: "Test description",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        1,
      ]);

      const result = await organizationService.findMany({
        page: 1,
        limit: 20,
      });

      expect(result.meta.pageCount).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it("should return pageCount of 1 for empty results", async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const result = await organizationService.findMany({
        page: 1,
        limit: 20,
      });

      expect(result.meta.pageCount).toBe(1);
    });

    it("should preserve all pagination metadata fields", async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [
          {
            id: "prop-123",
            organizationId: "org-123",
            name: "Test Property",
            code: "PROP_001",
            description: "Test property",
            addressLine1: "123 Main St",
            addressLine2: null,
            city: "Beijing",
            state: "Beijing",
            postalCode: "100000",
            country: "CN",
            timezone: "Asia/Shanghai",
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        50,
      ]);

      const result = await propertyService.findMany({
        organizationId: "org-123",
        page: 2,
        limit: 10,
      });

      expect(result.meta).toEqual({
        total: 50,
        page: 2,
        limit: 10,
        pageCount: 5,
      });
    });
  });

  describe("Mock Verification Tests", () => {
    it("should verify PrismaService.organization.create was called correctly", async () => {
      const dto = {
        name: "Test Organization",
        code: "TEST_ORG",
        description: "Test description",
        timezone: "Asia/Shanghai",
      };

      const mockOrganization = {
        id: "org-123",
        name: "Test Organization",
        code: "TEST_ORG",
        description: "Test description",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.organization.create.mockResolvedValue(mockOrganization);

      await organizationService.create(dto);

      expect(mockPrisma.organization.create).toHaveBeenCalled();
      expect(mockPrisma.organization.create).toHaveBeenCalledTimes(1);
    });

    it("should verify PrismaService.property.findFirst was called with correct where clause", async () => {
      const mockProperty = {
        id: "prop-123",
        organizationId: "org-123",
        name: "Test Property",
        code: "PROP_001",
        description: "Test property",
        addressLine1: "123 Main St",
        addressLine2: null,
        city: "Beijing",
        state: "Beijing",
        postalCode: "100000",
        country: "CN",
        timezone: "Asia/Shanghai",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);

      await propertyService.findById("prop-123", "org-123");

      expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
        where: {
          id: "prop-123",
          organizationId: "org-123",
        },
      });
    });

    it("should verify $transaction was called for pagination", async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await organizationService.findMany({
        page: 1,
        limit: 20,
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
