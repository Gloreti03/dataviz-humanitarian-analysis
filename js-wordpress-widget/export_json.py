"""
Step 1.1 — Export master_dataset.csv -> country_data.json
Run from inside the js-wordpress-widget/ folder:
    python export_json.py
"""
import json
from pathlib import Path

import pandas as pd

DATA_PATH   = Path(__file__).parent.parent / 'data' / 'master_dataset.csv'
OUTPUT_PATH = Path(__file__).parent / 'country_data.json'

# ISO 3166-1 alpha-3 -> alpha-2 (used to build flag emoji)
ISO3_TO_ISO2 = {
    'AFG':'AF','ALA':'AX','ALB':'AL','DZA':'DZ','ASM':'AS','AND':'AD','AGO':'AO',
    'AIA':'AI','ATA':'AQ','ATG':'AG','ARG':'AR','ARM':'AM','ABW':'AW','AUS':'AU',
    'AUT':'AT','AZE':'AZ','BHS':'BS','BHR':'BH','BGD':'BD','BRB':'BB','BLR':'BY',
    'BEL':'BE','BLZ':'BZ','BEN':'BJ','BMU':'BM','BTN':'BT','BOL':'BO','BES':'BQ',
    'BIH':'BA','BWA':'BW','BVT':'BV','BRA':'BR','IOT':'IO','BRN':'BN','BGR':'BG',
    'BFA':'BF','BDI':'BI','CPV':'CV','KHM':'KH','CMR':'CM','CAN':'CA','CYM':'KY',
    'CAF':'CF','TCD':'TD','CHL':'CL','CHN':'CN','CXR':'CX','CCK':'CC','COL':'CO',
    'COM':'KM','COG':'CG','COD':'CD','COK':'CK','CRI':'CR','CIV':'CI','HRV':'HR',
    'CUB':'CU','CUW':'CW','CYP':'CY','CZE':'CZ','DNK':'DK','DJI':'DJ','DMA':'DM',
    'DOM':'DO','ECU':'EC','EGY':'EG','SLV':'SV','GNQ':'GQ','ERI':'ER','EST':'EE',
    'SWZ':'SZ','ETH':'ET','FLK':'FK','FRO':'FO','FJI':'FJ','FIN':'FI','FRA':'FR',
    'GUF':'GF','PYF':'PF','ATF':'TF','GAB':'GA','GMB':'GM','GEO':'GE','DEU':'DE',
    'GHA':'GH','GIB':'GI','GRC':'GR','GRL':'GL','GRD':'GD','GLP':'GP','GUM':'GU',
    'GTM':'GT','GGY':'GG','GIN':'GN','GNB':'GW','GUY':'GY','HTI':'HT','HMD':'HM',
    'VAT':'VA','HND':'HN','HKG':'HK','HUN':'HU','ISL':'IS','IND':'IN','IDN':'ID',
    'IRN':'IR','IRQ':'IQ','IRL':'IE','IMN':'IM','ISR':'IL','ITA':'IT','JAM':'JM',
    'JPN':'JP','JEY':'JE','JOR':'JO','KAZ':'KZ','KEN':'KE','KIR':'KI','PRK':'KP',
    'KOR':'KR','KWT':'KW','KGZ':'KG','LAO':'LA','LVA':'LV','LBN':'LB','LSO':'LS',
    'LBR':'LR','LBY':'LY','LIE':'LI','LTU':'LT','LUX':'LU','MAC':'MO','MKD':'MK',
    'MDG':'MG','MWI':'MW','MYS':'MY','MDV':'MV','MLI':'ML','MLT':'MT','MHL':'MH',
    'MTQ':'MQ','MRT':'MR','MUS':'MU','MYT':'YT','MEX':'MX','FSM':'FM','MDA':'MD',
    'MCO':'MC','MNG':'MN','MNE':'ME','MSR':'MS','MAR':'MA','MOZ':'MZ','MMR':'MM',
    'NAM':'NA','NRU':'NR','NPL':'NP','NLD':'NL','NCL':'NC','NZL':'NZ','NIC':'NI',
    'NER':'NE','NGA':'NG','NIU':'NU','NFK':'NF','MNP':'MP','NOR':'NO','OMN':'OM',
    'PAK':'PK','PLW':'PW','PSE':'PS','PAN':'PA','PNG':'PG','PRY':'PY','PER':'PE',
    'PHL':'PH','PCN':'PN','POL':'PL','PRT':'PT','PRI':'PR','QAT':'QA','REU':'RE',
    'ROU':'RO','RUS':'RU','RWA':'RW','BLM':'BL','SHN':'SH','KNA':'KN','LCA':'LC',
    'MAF':'MF','SPM':'PM','VCT':'VC','WSM':'WS','SMR':'SM','STP':'ST','SAU':'SA',
    'SEN':'SN','SRB':'RS','SYC':'SC','SLE':'SL','SGP':'SG','SXM':'SX','SVK':'SK',
    'SVN':'SI','SLB':'SB','SOM':'SO','ZAF':'ZA','SGS':'GS','SSD':'SS','ESP':'ES',
    'LKA':'LK','SDN':'SD','SUR':'SR','SJM':'SJ','SWE':'SE','CHE':'CH','SYR':'SY',
    'TWN':'TW','TJK':'TJ','TZA':'TZ','THA':'TH','TLS':'TL','TGO':'TG','TKL':'TK',
    'TON':'TO','TTO':'TT','TUN':'TN','TUR':'TR','TKM':'TM','TCA':'TC','TUV':'TV',
    'UGA':'UG','UKR':'UA','ARE':'AE','GBR':'GB','USA':'US','UMI':'UM','URY':'UY',
    'UZB':'UZ','VUT':'VU','VEN':'VE','VNM':'VN','VGB':'VG','VIR':'VI','WLF':'WF',
    'ESH':'EH','YEM':'YE','ZMB':'ZM','ZWE':'ZW','XKX':'XK',
}


def iso2_to_flag(iso2):
    if not iso2 or len(iso2) != 2:
        return ''
    return ''.join(chr(0x1F1E6 + ord(c) - ord('A')) for c in iso2.upper())


def assign_crisis_level(peak, q33, q66, q90):
    if peak == 0:
        return 'minimal'
    if peak < q33:
        return 'low'
    if peak < q66:
        return 'medium'
    if peak < q90:
        return 'high'
    return 'critical'


def main():
    print(f'Reading {DATA_PATH} ...')
    df = pd.read_csv(DATA_PATH)
    df = df[df['year'].between(2010, 2022)].copy()
    df['total_displaced'] = df['total_displaced'].fillna(0)

    country_peak = df.groupby('country_iso')['total_displaced'].max()
    nonzero      = country_peak[country_peak > 0]
    q33 = float(nonzero.quantile(0.33))
    q66 = float(nonzero.quantile(0.66))
    q90 = float(nonzero.quantile(0.90))
    global_max = float(df['total_displaced'].max())

    print(f'  Countries       : {df["country_iso"].nunique()}')
    print(f'  Global max disp : {global_max:>15,.0f}')
    print(f'  q33 / q66 / q90 : {q33:>10,.0f} / {q66:>10,.0f} / {q90:>10,.0f}')

    countries = {}
    for iso, group in df.sort_values('year').groupby('country_iso'):
        g = group.sort_values('year')

        years     = g['year'].tolist()
        mortality = [round(float(v), 2) if pd.notna(v) else None for v in g['mortality_1t4']]
        displaced = [int(v) for v in g['total_displaced']]

        gdp_series = g['gdp_per_capita'].dropna()
        gdp = round(float(gdp_series.iloc[-1])) if not gdp_series.empty else None

        peak = max(displaced) if displaced else 0

        iso2 = ISO3_TO_ISO2.get(iso, '')
        flag = iso2_to_flag(iso2)

        countries[iso] = {
            'name'            : g['country_name'].iloc[0],
            'flag'            : flag,
            'years'           : years,
            'mortality'       : mortality,
            'total_displaced' : displaced,
            'gdp_per_capita'  : gdp,
            'crisis_level'    : assign_crisis_level(peak, q33, q66, q90),
        }

    result = {
        'global_max_displaced': int(global_max),
        'countries'           : countries,
    }

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    missing_flags = [iso for iso, c in countries.items() if not c['flag']]
    print(f'\nSaved: {OUTPUT_PATH.name}  ({len(countries)} countries, {size_kb:.1f} KB)')
    if missing_flags:
        print(f'  Missing flags for: {", ".join(missing_flags)}')


if __name__ == '__main__':
    main()
