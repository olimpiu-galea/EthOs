import { describe, expect, it } from "vitest";
import { parseDcsCsv } from "./dcs-parser";

const HEADER =
  "id,value,name,desc,category,fieldType,frequency,displayLabel,unit";

describe("parseDcsCsv", () => {
  it("accepts header with fieldType and displayLabel casing", () => {
    const csv = `${HEADER}
TE-1/_.PV#Value,10,T1,Desc,Temperature,analog,1min,Temp PV,°C`;
    const tags = parseDcsCsv(csv);
    expect(tags).toHaveLength(1);
    expect(tags[0].fieldType).toBe("analog");
    expect(tags[0].displayLabel).toBe("Temp PV");
  });
});
