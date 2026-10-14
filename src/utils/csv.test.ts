import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("joins rows with CRLF and cells with commas", () => {
    expect(
      toCsv([
        ["分組", "姓名"],
        ["青少年", "林敬棠"],
      ]),
    ).toBe("分組,姓名\r\n青少年,林敬棠");
  });

  it("quotes cells containing commas, quotes or newlines", () => {
    expect(toCsv([["a,b", 'say "hi"', "x\ny", 3]])).toBe(
      '"a,b","say ""hi""","x\ny",3',
    );
  });
});
