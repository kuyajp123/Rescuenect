{data && data.hourlyData ? (
                data.hourlyData
                  .filter((hourly: any) => {
                    const hourlyDate = new Date(hourly.time).toDateString();
                    const today = new Date().toDateString();
                    return hourlyDate === today;
                  })
                  .slice(0, 24) // Limit to 24 hours max
                  .map((hourly: any) => (
                    <DayForecastData
                      key={hourly.time}
                      time={hourly.time}
                      weatherCode={hourly.weatherCode}
                      temperature={hourly.temperature}
                    />
                  ))