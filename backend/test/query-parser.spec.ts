import { parseListQuery } from "../src/common/query-parser";

describe("parseListQuery", () => {
  it("parses page/limit style queries", () => {
    const result = parseListQuery({ page: "2", limit: "10" });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.sort).toBeUndefined();
    expect(result.order).toBeUndefined();
    expect(result.raw.page).toBe("2");
  });

  it("parses _start/_end style queries", () => {
    const result = parseListQuery({ _start: "0", _end: "20" });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("gives precedence to explicit page/limit over _start/_end", () => {
    const result = parseListQuery({
      page: "3",
      limit: "5",
      _start: "0",
      _end: "20",
      sort: "createdAt",
      order: "DESC",
    });

    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(5);
    expect(result.sort).toBe("createdAt");
    expect(result.order).toBe("desc");
  });

  it("parses legacy sort parameters when internal sort/order are missing", () => {
    const result = parseListQuery({ _sort: "name", _order: "ASC" });

    expect(result.sort).toBe("name");
    expect(result.order).toBe("asc");
  });

  it("falls back to defaults when values are invalid", () => {
    const result = parseListQuery({
      page: "-1",
      limit: "0",
      _start: "foo",
      _end: "bar",
    });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});
