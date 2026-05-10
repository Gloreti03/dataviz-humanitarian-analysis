<div align="center">

# Born Displaced
### The Silent Crisis Killing Children We Never See

*An IFRC Data & Analytics Unit Campaign, 2023*

</div>

---

## 🌐 Live Website

The full interactive project is available here:

### 👉 **[https://gloreti03.github.io/dataviz-humanitarian-analysis/](https://gloreti03.github.io/dataviz-humanitarian-analysis/)** 👈

---

## About The Project

Between 2018 and 2022, an estimated **1.9 million children** were born as refugees, approximately 385,000 every year. They are born into camps, transit zones, and countries that did not ask for them and cannot always protect them.

This repository contains the exploratory data analysis and visualization source code for the **Born Displaced** campaign. It combines the burden of displacement with the burden of child mortality using data from UNHCR, UNICEF, and the World Bank, tracking 195 countries over 13 years (2010–2022).

The analysis builds a **Crisis Index** to identify where children are both fleeing and dying, showing that the accident of being born in a conflict zone should not be a death sentence.

## Getting Started

Follow these steps to run the data analysis and visualizations locally:

### 1. Clone the repository
```bash
git clone https://github.com/Gloreti03/dataviz-humanitarian-analysis.git
cd dataviz-humanitarian-analysis
```

### 2. Set up the environment
Create a virtual environment and install the required dependencies:
```bash
python -m venv env
source env/bin/activate  # On Windows use: env\Scripts\activate
pip install -r requirements.txt
```

### 3. Run the analysis
Start Jupyter Notebook to explore the data preparation and visualizations:
```bash
jupyter notebook
```
- **`cleaning_integration.ipynb`** — Data cleaning and integration processes
- **`python_visualizations.ipynb`** — Data visualizations generation

## Data Sources

| Source | Dataset |
|--------|---------|
| **UNHCR** | Global Trends in Forced Displacement 2022 |
| **UNICEF** | Levels and Trends in Child Mortality 2022 |
| **World Bank** | WDI Population and Demographics |

---

<div align="center">

*This is not a refugee crisis. It is a civilizational failure.*

</div>