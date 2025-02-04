import './Main.css';
import Plot from 'react-plotly.js';
import cdcData from './data.json';
import geoData from './geojson-counties-fips.json';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

function Main() {
  const { id } = useParams();
  const queryParameters = new URLSearchParams(window.location.search);
  const n = queryParameters.get('n') || 42;
  const w = queryParameters.get('w') || -100;
  const zoom = queryParameters.get('zoom') || 3;
  const [showSources, setShowSources] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [selectedFips, setSelectedFips] = useState([]);
  const [mapBoxData, setMapBoxData] = useState(() => {
    if (n && w && zoom) {
      return { center: { lon: w, lat: n }, zoom: zoom, style: 'dark' }; // Use dark theme for map
    }
    return { center: { lon: -100, lat: 42 }, zoom: 3, style: 'dark' }; // Use dark theme for map
  });
  const [data, setData] = useState(() => {
    if (id) {
      if (selectedFips.length === 0) {
        const filteredData = Object.keys(cdcData.counties).reduce((obj, key) => {
          if (key.startsWith(id)) {
            obj[key] = cdcData.counties[key];
          }
          return obj;
        }, {});

        const filter = filteredData;
        return { counties: filter };
      } else {
        return cdcData;
      }
    } else {
      // Filter data to include only New Jersey counties
      const filteredData = Object.keys(cdcData.counties).reduce((obj, key) => {
        if (cdcData.counties[key].location.state === 'NJ') {
          obj[key] = cdcData.counties[key];
        }
        return obj;
      }, {});
      return { counties: filteredData };
    }
  });

  function roundTo4(num) {
    return Math.round(num * 10000) / 10000;
  }

  const clickCounty = (event) => {
    console.log(event);
    var w = event.points[0].ct[0],
      n = event.points[0].ct[1],
      zoom = 5;
    const url = `/state/${event.points[0].location.substring(0, 2)}?n=${n}&w=${w}&zoom=${zoom}`;
    window.open(url, '_self');
  };

  function maxRate(data) {
    let max = 0;
    Object.values(data.counties).map((value) => {
      if (max < (value.suicideData.deaths / value.suicideData.population) * 100000) {
        max = (value.suicideData.deaths / value.suicideData.population) * 100000;
      }
    });
    return max;
  }

  return (
    <div className="App" style={{ backgroundColor: '#000', color: '#fff' }}>
      {showBanner && (
        <div id="banner" style={{ backgroundColor: '#e62429', padding: '10px', textAlign: 'center' }}>
          <p style={{ color: '#fff', margin: 0 }}>
            Are you thinking about killing yourself? Talk to someone in New Jersey by calling or texting{' '}
            <i>
              <a href="tel:988" target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                988
              </a>
            </i>{' '}
            or{' '}
            <a href="http://www.suicide.org/hotlines/international-suicide-hotlines.html" target="_blank" rel="noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
              talk to someone near you.
            </a>
          </p>
          <button
            onClick={() => {
              setShowBanner(!showBanner);
            }}
            style={{ backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            X
          </button>
        </div>
      )}
      <header className="App-header" style={{ backgroundColor: '#000', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#e62429', fontFamily: 'Arial, sans-serif', fontSize: '2.5rem' }}>2020 Suicide Rate Map Explorer</h1>
        <p style={{ color: '#fff', fontFamily: 'Arial, sans-serif' }}>
          This map illustrates the number of people who died by suicide in New Jersey.
          <br />
          <b style={{ color: '#e62429' }}>Click a city to isolate the data.</b>{' '}
          <a href="/" value="0" style={{ color: '#fff', textDecoration: 'underline' }}>
            View All Cities
          </a>
        </p>
      </header>
      <div id="map">
        {
          <Plot
            data={[
              {
                type: 'choroplethmapbox',
                locations: Object.keys(data.counties),
                z: Object.values(data.counties).map((value) => {
                  if (value.suicideData.deaths === 0) {
                    return 0;
                  }
                  return (value.suicideData.deaths / value.suicideData.population) * 100000;
                }),
                geojson: geoData,
                colorscale: [
                  [0, '#000'], // Black for low values
                  [0.5, '#e62429'], // Red for mid values
                  [1, '#0047ab'], // Blue for high values
                ],
                marker: {
                  line: {
                    color: 'rgba(255,255,255,0.6)', // White borders for contrast
                    width: 0.05,
                  },
                },
                hoverlabel: {
                  bgcolor: '#000', // Black background for hover labels
                  font: {
                    color: '#fff', // White text for hover labels
                  },
                },
                hovertemplate: Object.values(data.counties).map((value) => {
                  return `<b>
                    County: ${value.location.county}<br>
                    State: ${value.location.state}<br>
                    Suicide Rate: <span style="color:#e62429;">${
                      value.suicideData.deaths === 0
                        ? 'less than ' + roundTo4((10 / value.suicideData.population) * 100)
                        : roundTo4((value.suicideData.deaths / value.suicideData.population) * 100)
                    }%</span><br>
                    Number of Suicide Deaths: <span style="color:#e62429;">${
                      value.suicideData.deaths === 0 ? 'less than 10' : value.suicideData.deaths
                    }</span><br>
                    No Religious Attendance: <span style="color:#e62429;">${
                      roundTo4(100 - value.religionData.attendanceRate * 100)
                    }%</span>
                  </b><extra></extra>`;
                }),
                showscale: false,
              },
            ]}
            layout={{
              mapbox: {
                ...mapBoxData,
                style: 'dark', // Dark map theme
              },
              width: window.innerWidth,
              height: window.innerHeight,
              margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
                pad: 0,
              },
              paper_bgcolor: '#000', // Black background for the map
              plot_bgcolor: '#000', // Black background for the plot
            }}
            onClick={clickCounty}
          />
        }
      </div>
      <div id="legend" style={{ backgroundColor: '#000', padding: '10px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontFamily: 'Arial, sans-serif' }}>(2020 Suicide Deaths / Population) * 100000</p>
        <span style={{ color: '#e62429' }}>{Math.round(maxRate(data))}</span>
        <span style={{ color: '#e62429' }}>{Math.round((maxRate(data) / 2 / 2) * 3)}</span>
        <span style={{ color: '#e62429' }}>{Math.round(maxRate(data) / 2)}</span>
        <span style={{ color: '#e62429' }}>{Math.round(maxRate(data) / 2 / 2)}</span>
        <span style={{ color: '#e62429' }}>0</span>
        <hr style={{ borderColor: '#e62429' }} />
      </div>
      {!showSources && (
        <button
          id="sourceButton"
          onClick={() => {
            setShowSources(!showSources);
          }}
          style={{ backgroundColor: '#e62429', color: '#fff', border: 'none', padding: '10px 20px', cursor: 'pointer' }}
        >
          Data Sources
        </button>
      )}
      {showSources && (
        <div id="sources" style={{ backgroundColor: '#000', padding: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setShowSources(!showSources);
            }}
            style={{ backgroundColor: '#e62429', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            X
          </button>
          <h3 style={{ color: '#e62429', fontFamily: 'Arial, sans-serif' }}>Data Sources</h3>
          <p style={{ color: '#fff', fontFamily: 'Arial, sans-serif' }}>Data sourced from CDC and other public health databases.</p>
        </div>
      )}
    </div>
  );
}

export default Main;
