import wbgapi as wb
import pandas as pd

INDICATORS = {
    "NY.GDP.PCAP.CD": "gdp_per_capita",
    "SL.UEM.TOTL.ZS": "unemployment_rate",
    "FP.CPI.TOTL.ZG": "inflation_cpi",
}

YEARS = range(2010, 2023)
year_cols = [f"YR{y}" for y in YEARS]

frames = []
for code, name in INDICATORS.items():
    df = wb.data.DataFrame([code], time=YEARS, labels=True).reset_index()
    df = df.rename(columns={"economy": "country_code", "Country": "country_name"})
    df = df.melt(
        id_vars=["country_code", "country_name"],
        value_vars=[c for c in year_cols if c in df.columns],
        var_name="year",
        value_name=name,
    )
    df["year"] = df["year"].str.replace("YR", "").astype(int)
    frames.append(df.set_index(["country_code", "country_name", "year"]))

result = pd.concat(frames, axis=1).reset_index()
result = result.sort_values(["country_code", "year"]).reset_index(drop=True)

result.to_csv("worldbank_macro.csv", index=False)

print(f"Saved {len(result)} rows to worldbank_macro.csv")
print(result.head(10).to_string())
print(f"\nMissing values:\n{result[list(INDICATORS.values())].isna().sum()}")
