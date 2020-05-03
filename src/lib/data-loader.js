import * as d3 from "d3";
import stateAbbreviations from "../../data/state-abbreviations";

const loadData = async () => {
  const states = loadStates();
  const counties = loadCounties();
  const world = loadWorld();

  const areas = [].concat(await states, await counties, await world);

  addDailyDifferences(areas);

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

  return partition(item => item.state)(data);
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

  const nameF = item => {
    const stateAbbreviation = stateAbbreviations[item.state] || item.state;

    return `${item.county}, ${stateAbbreviation}`;
  };

  return partition(nameF)(data);
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

const addDailyDifferences = areas => {
  for (let area of areas) {
    let casesYesterday = 0;
    let deathsYesterday = 0;

    for (let day of area.values) {
      day.newCases = day.cases - casesYesterday;
      day.newDeaths = day.deaths - deathsYesterday;

      casesYesterday = day.cases;
      deathsYesterday = day.deaths;
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
