let weatherAPIKey = `c608b5111fe52f490f9cac5a97034cf8`;
let weatherBaseEndpoint = `https://api.openweathermap.org/data/2.5/weather?units=metric&appid=${weatherAPIKey}`;
let forecastBaseEndpoint = `https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=${weatherAPIKey}`;
let currentLocationBaseEndpoint = `https://api.openweathermap.org/geo/1.0/reverse?&limit=5&appid=${weatherAPIKey}`;

let searchForm = document.querySelector(`.search-form`);
let city = document.querySelector(`.weather-city>.value`);
let country = document.querySelector(`.weather-city>.country-value`);
let day = document.querySelector(`.weather-day>.value`);
let time = document.querySelector(`.weather-day>.time-value`);
let humidity = document.querySelector(`.weather-humidity>.value`);
let wind = document.querySelector(`.weather-wind>.value`);
let pressure = document.querySelector(`.weather-pressure>.value`);
let image = document.querySelector(`.weather-img`);
let temperature = document.querySelector(`.weather-temperature`);
let temperatureFeelsLike = document.querySelector(`.feels-like>.value`);
let forecastCard = document.querySelector(`.weather-forecast-row`);
let searchInput = document.querySelector(`.weather-search`);
let currentLocationBtn = document.querySelector(`.current-location-btn`);
let saveFavoriteCityBtn = document.querySelector(`.save-location-btn`);
let recallFavoriteCityBtn = document.querySelector(`.recall-location-btn`);

async function getWeatherByCityName(city) {
    try {
        let endpoint = `${weatherBaseEndpoint}&q=${city}`;
        let response = await fetch(endpoint);

        if (!response.ok) {
            console.error(`Error fetching current weather: ${response.statusText}`);
            return; // funkcija ce ovako log-ovati gresku u konzoli i odmah se zavrsi, a ne da se loš response prenese dalje
        }

        let weather = await response.json();

        console.log(weather);
        return weather;
    }
    catch (error) {
        console.error(`Error fetching city name: ${error}`);
    }
}

async function getForecastByCityID(id) {
    try {
        let endpoint = `${forecastBaseEndpoint}&id=${id}`;
        let response = await fetch(endpoint);

        if (!response.ok) {
            console.error(`Error fetching forecast: ${response.statusText}`);
            return;
        }

        let forecast = await response.json();
        let forecastList = forecast.list;
        let daily = [];

        forecastList.forEach(day => {
            let date = new Date(day.dt_txt.replace(` `, `T`)); // ovako smo morali da formatiramo datum zato sto u java scriptu format je 2024-08-06T12:00:00
            let hours = date.getHours();
            if (hours === 12) {
                daily.push(day);
            }
        });
        
        console.log(daily);
        return daily;
    }
    catch (error) {
        console.error(`Error in getting City ID: ${error}`);
    }
}

//  zbog prirode navigator.geolocation.getCurrentPosition koja vraca rukovanje uspesnim i neuspesnim slucajevima kao callback funkcije,
//  morali smo da napisemo new Promise, zato sto ova funkcija sama po sebi ne vraca direktno Promise kako bismo koristili async/await
function getCurrentLocationPromise() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    })
}

async function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert(`Geolocation is not supported by your browser`)
        return;
    }

    try {
        let position = await getCurrentLocationPromise();
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;

        let endpoint = `${currentLocationBaseEndpoint}&lat=${lat}&lon=${lon}`;
        let result = await fetch(endpoint);
        let currentLocation = await result.json();

        return currentLocation[0].name;
    }
    catch (error) {
        console.error(error);
    }
}

async function getWeatherData(data) {
    try {
        let weather = await getWeatherByCityName(data);
        updateCurrentWeather(weather);

        let cityID = weather.id;
        let forecast = await getForecastByCityID(cityID);
        updateForecast(forecast);
    }
    catch (error) {
        console.error(`Error getting location: ${error}`);
    }
}

function getDayOfWeek(dt = new Date().getTime()) {
    return new Date(dt).toLocaleDateString(`en-EN`, { weekday: "short" });
}

function getLocationTime(data) {
    let currentTimeMilliSeconds = Date.now();
    let timezoneMilliSeconds = data.timezone * 1000;
    let locationTimeMilliSeconds = currentTimeMilliSeconds + timezoneMilliSeconds;

    let adjustedTime = new Date(locationTimeMilliSeconds);

    let hours = adjustedTime.getUTCHours();
    let minutes = adjustedTime.getUTCMinutes();

    hours = hours < 10 ? `0${hours}` : hours; // dodajemo 0 ako je ispod 10 sati
    minutes = minutes < 10 ? `0${minutes}` : minutes; // dodajemo 0 ako je ispod 10 minuta

    let ampm = hours <= 12 ? "AM" : "PM";

    return `${hours}:${minutes} ${ampm}`;
}

function getWindDirection(data) {
    let windDirection;
    let deg = data.wind.deg;

    if (deg > 45 && deg <= 135) {
        windDirection = `East`;
    }
    else if (deg > 135 && deg <= 225) {
        windDirection = `South`;
    }
    else if (deg > 225 && deg <= 315) {
        windDirection = `West`;
    }
    else {
        windDirection = `North`;
    }

    return windDirection;
}

function updateCurrentWeather(data) {
    if (data.cod == 200) {
        city.textContent = data.name;
        country.textContent = `, ${data.sys.country}`;
        day.textContent = `${getDayOfWeek()}`;
        time.textContent = `, ${getLocationTime(data)}`;
        humidity.textContent = data.main.humidity;
        pressure.textContent = data.main.pressure;
        wind.textContent = `${getWindDirection(data)}, ${data.wind.speed}`;
        temperature.textContent = updateTemperature(data);
        temperatureFeelsLike.textContent = updateFeelsLikeTemperature(data);
        image.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    }
    else if (data.cod == 404) {
        alert(`Location not found.`);
        preventDefault();
    }
}

function updateForecast(forecast) {
    forecastCard.innerHTML = ``; // Cistimo sve sto se nalazi u forecast kartici

    forecast.forEach((day) => {
        let iconURL = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
        let dayForecast = getDayOfWeek(day.dt * 1000); // Racunamo vreme u milisekundama, zato moramo da convertujemo sekunde u milisekunde
        let temp = updateTemperature(day);
        let forecastItem = 
        `
            <div class="col-4 col-md-2">
                <div class="card">
                    <img src="${iconURL}" class="card-img-top" alt="${day.weather[0].description}">
                    <div class="card-body">
                      <p class="card-text">${dayForecast}</p>
                      <p class="card-text"><span>${temp}</span>&deg;C</p>
                    </div>
                  </div>
            </div>
        `;

        forecastCard.insertAdjacentHTML("beforeend", forecastItem); // beforeend kako bi stavili element unutar elementa nakon njegovog poslednjeg child elementa
    });
}

function updateTemperature(data) {
    return data.main.temp > 0 ? `+ ${Math.round(data.main.temp)}` : Math.round(data.main.temp);
}

function updateFeelsLikeTemperature(data) {
    return data.main.feels_like > 0 ? `+ ${Math.round(data.main.feels_like)}` : Math.round(data.main.feels_like);
}

async function defaultWeatherPage() {
    let weather = await getWeatherByCityName("Kraljevo");
    updateCurrentWeather(weather);

    let cityID = weather.id;
    let forecast = await getForecastByCityID(cityID);
    updateForecast(forecast);
}

defaultWeatherPage(); // kada ucitamo stranicu prikazuje nam vreme Kraljeva kao default-nu lokaciju

searchForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // sprecava reload stranice kada se submit

    let cityName = searchInput.value.trim();

    if (cityName) {
        try {
            await getWeatherData(cityName);
        }
        catch (error) {
            console.error(`Error in getting weather data: ${error}`);
        }
    }
    else {
        alert(`Please type in city name`);
    }

    searchInput.value = ""; // kada korisnik submit-uje da se ocisti search bar
});

currentLocationBtn.addEventListener(`click`, async () => {
    let currentLocation = await getCurrentLocation();

    if (currentLocation) {
        await getWeatherData(currentLocation)
    }
    else {
        alert(`Current location button is not working`);
    }
});

saveFavoriteCityBtn.addEventListener(`click`, () => {
    localStorage.setItem(`favoriteCity`, city.textContent);

    alert(`Successfuly saved current location to favorite!`);
});

recallFavoriteCityBtn.addEventListener(`click`, async () => {
    let favoriteCity = localStorage.getItem(`favoriteCity`);

    if (favoriteCity) {
        await getWeatherData(favoriteCity);
    }
    else {
        alert(`You do not have any saved favorite locations.`);
    }
});