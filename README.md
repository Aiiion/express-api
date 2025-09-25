You will need your own API key for openwheatermaps to get weatherdata. Add it in an .env file at the root as WEATHER_API_KEY.

Start this app up using docker:
docker compose build
docker compose up

Or without docker:
npm install
npm start

/
Get app and contact info

/test
Test if the api is running

/weather
Combines these two requests, you can use the same query as described in the docs (but without appid)
https://openweathermap.org/current
https://openweathermap.org/forecast5

/pollution
Combines these current and forcast requests, you can use the same query as described in the docs (but without appid)
https://openweathermap.org/api/air-pollution
