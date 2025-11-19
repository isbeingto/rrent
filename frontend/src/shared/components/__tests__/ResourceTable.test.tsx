import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // Import jest-dom matchers
import { ResourceTable } from "../ResourceTable";

// Mock Refine hooks
jest.mock("@refinedev/core", () => ({
  useCan: () => ({ data: { can: true } }),
  useTranslate: () => ((key: string) => key),
  useList: () => ({ data: { data: [], total: 0 } }),
}));

jest.mock("@refinedev/antd", () => ({
  useTable: () => ({
    tableProps: {
      dataSource: [
        { id: "1", name: "Test Item", amount: 100 },
      ],
      pagination: {},
      loading: false,
    },
    tableQuery: { isLoading: false },
  }),
  CreateButton: () => <button>Create</button>,
  List: ({ children, title }: { children: React.ReactNode; title: string }) => <div><h1>{title}</h1>{children}</div>,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../../../components/ui", () => ({
  TableSkeleton: () => <div>Skeleton</div>,
  SectionEmpty: () => <div>Empty</div>,
}));

// Mock Antd Table to check props
jest.mock("antd", () => {
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    Table: (props: { columns: { key: string; title: string }[]; dataSource: { id: string; name: string }[]; size?: string; scroll?: { x: number | string } }) => {
      return (
        <div data-testid="mock-table" data-size={props.size} data-scroll-x={props.scroll?.x}>
          <table>
            <thead>
              <tr>
                {props.columns.map((col: { key: string; title: string }) => (
                  <th key={col.key}>{col.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.dataSource.map((row: { id: string; name: string }) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  };
});

describe("ResourceTable", () => {
  it("renders with correct density and scroll props", () => {
    const columns = [
      { title: "Name", dataIndex: "name", key: "name" },
      { title: "Amount", dataIndex: "amount", key: "amount", align: "right" as const, width: 120 },
    ];

    render(
      <ResourceTable
        resource="test"
        columns={columns}
      />
    );

    const table = screen.getByTestId("mock-table");
    
    // Verify density (FE-5-109)
    expect(table).toHaveAttribute("data-size", "middle");
    
    // Verify scroll (FE-5-109)
    expect(table).toHaveAttribute("data-scroll-x", "1000");

    // Verify columns
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
  });
});
