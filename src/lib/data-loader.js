import * as d3 from "d3";

const loadData = async () => {
  const states = loadStates();
  const counties = loadCounties();
  const world = loadWorld();
  const populationData = loadPopulationData();

  const areas = [].concat(await states, await counties, await world);

  addDailyDifferences(areas);
  addPopulationData(areas, await populationData);

  return Object.freeze(areas);
};

const loadStates = async () => {
  const data = await d3.csv(
    "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv",
    d => {
      d.date = parseDate(d.date);
      d.cases = parseInt(d.cases);
      d.deaths = parseInt(d.deaths);
      return d;
    }
  );

  return partition(item => `${item.state}, US`)(data);
};

const loadCounties = async () => {
  const data = await d3.csv(
    "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
    d => {
      d.date = parseDate(d.date);
      d.cases = parseInt(d.cases);
      d.deaths = parseInt(d.deaths);
      return d;
    }
  );

  return partition(item => `${item.county}, ${item.state}, US`)(data);
};

const loadWorld = async () => {
  const cases = d3.csv(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
  );

  const deaths = d3.csv(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"
  );

  const casesAndDeaths = d3.zip(await cases, await deaths);
  const dates = (await cases).columns.slice(4); // Remove region and position columns

  const key = item => {
    const region1 = item["Country/Region"];
    const region2 = item["Province/State"];
    return [region2, region1].filter(i => i.length > 0).join(", ");
  };

  const values = (cases, deaths) =>
    dates.map(date => ({
      date: parseUsDate(date),
      cases: parseInt(cases[date]),
      deaths: parseInt(deaths[date])
    }));

  const entry = (cases, deaths) => ({
    key: key(cases),
    values: values(cases, deaths)
  });

  return casesAndDeaths.map(item => entry(item[0], item[1]));
};

const loadPopulationData = () =>
  d3.csv(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv"
  );

const addPopulationData = (areas, populationData) => {
  const areaToPopulation = populationData.reduce((acc, item) => {
    acc[item["Combined_Key"]] = parseInt(item["Population"]);

    return acc;
  }, {});

  for (let area of areas) {
    const population = areaToPopulation[area.key];

    if (population == undefined) {
      continue;
    }

    for (let day of area.values) {
      day.population = population;
    }
  }
};

const addDailyDifferences = areas => {
  for (let area of areas) {
    let casesYesterday = 0;
    let deathsYesterday = 0;

    let movingSumCases = 0;
    let movingSumDeaths = 0;

    for (let i = 0, n = area.values.length; i < n; i++) {
      let day = area.values[i];

      day.newCases = day.cases - casesYesterday;
      day.newDeaths = day.deaths - deathsYesterday;

      casesYesterday = day.cases;
      deathsYesterday = day.deaths;

      movingSumCases += day.newCases;
      movingSumDeaths += day.newDeaths;

      day.movingNewCases = movingSumCases / Math.min(i + 1, 7);
      day.movingNewDeaths = movingSumDeaths / Math.min(i + 1, 7);

      if (i >= 6) {
        movingSumCases -= area.values[i - 6].newCases;
        movingSumDeaths -= area.values[i - 6].newDeaths;
      }
    }
  }
};

const partition = keyF => data =>
  d3
    .nest()
    .key(keyF)
    .entries(data);

const parseDate = d3.utcParse("%Y-%m-%d");
const parseUsDate = d3.utcParse("%m/%d/%y");

export default loadData;
