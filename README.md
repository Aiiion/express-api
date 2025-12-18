# Usage

**Start this app up using docker (production):**

docker compose build

docker compose up

**Or without docker (production):**

npm install --omit=dev

npm start

*You will need your own API key for openwheatermaps to get weatherdata. Add it in an .env file at the root as WEATHER_API_KEY.*

**Start this app up for development:**

npm install

npm run start:dev

**Run tests:**

npm test

# Endpoints

### (GET) **/** 

Get app- and contact info

### (GET) **/test**

Test if the api is running

### (GET) **/cv**

Downloads my CV as a pdf

### (GET) **/weather**

Combines these two requests, you can use the same query as described in the docs (but without appid)

https://openweathermap.org/current

https://openweathermap.org/forecast5

### (GET) **/weather/pollution**

Combines these current and forecast requests, you can use the same query as described in the docs (but without appid)

https://openweathermap.org/api/air-pollution

### (GET) **/weather/aggregate** (Beta)

Combines these three requests, you can use the same query as described in the docs (but without appid)

https://openweathermap.org/current

https://openweathermap.org/forecast5 (weather data sorted in to days)

https://openweathermap.org/api/air-pollution (only current)
