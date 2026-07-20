import fastf1
from fastapi import FastAPI

from db.models import Race, RaceEntry, Lap

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/seasons")
def read_seasons():
    return [i for i in range(2022, 2026)]


@app.get("/races/{year}")
def read_races(year: int):
    races: list[Race] = Race.select().where(Race.year == year).execute()
    races_json = []
    for race in races:
        races_json.append({
            "eventName": race.event_name,
            "officialName": race.official_name,
            "country": race.country,
            "location": race.location,
            "raceDate": race.race_date,
            "totalLaps": race.total_laps,
            "roundNumber": race.round_number,
        })
    return races_json


@app.get("/races/{year}/{round_number}")
def read_race(round_number: int, year: int):
    race = Race.get_or_none((Race.round_number == round_number) & (Race.year == year))
    if not race:
        return {"error": "Race not found"}
    return {
        "eventName": race.event_name,
        "officialName": race.official_name,
        "country": race.country,
        "location": race.location,
        "raceDate": race.race_date,
        "totalLaps": race.total_laps,
        "roundNumber": race.round_number,
    }


@app.get("/races/{year}/{round_number}/drivers")
def read_drivers(year: int, round_number: int):
    race = Race.get_or_none((Race.round_number == round_number) & (Race.year == year))
    if not race:
        return {"error": "Race not found"}
    drivers: list[RaceEntry] = RaceEntry.select().where(RaceEntry.race == race).execute()
    drivers_json = []
    for driver in drivers:
        drivers_json.append({
            "firstName": driver.first_name,
            "lastName": driver.last_name,
            "fullName": driver.full_name,
            "driverNumber": driver.driver_number,
            "driverCode": driver.driver_code,
            "teamName": driver.team_name,
            "headshotUrl": driver.headshot_url,
            "points": driver.points,
            "status": driver.status,
            "finishPosition": driver.finish_position,
            "gridPosition": driver.grid_position,
            "classifiedPosition": driver.classified_position,
        })
    return drivers_json


@app.get("/races/{year}/{round_number}/{driver_code}/laps")
def read_laps(year: int, round_number: int, driver_code: str):
    race = Race.get_or_none((Race.round_number == round_number) & (Race.year == year))
    if not race:
        return {"error": "Race not found"}
    entry = RaceEntry.select().where((RaceEntry.race == race) & (RaceEntry.driver_code == driver_code)).first()
    laps: list[Lap] = Lap.select().where(Lap.entry == entry).execute()
    laps_json = []
    for lap in laps:
        laps_json.append({
            "lapNumber": lap.lap_number,
            "lapTime": lap.lap_time_seconds,
            "sector1Time": lap.sector1_seconds,
            "sector2Time": lap.sector2_seconds,
            "sector3Time": lap.sector3_seconds,
            "compound": lap.compound,
            "tyreLife": lap.tyre_life,
            "freshTyre": lap.fresh_tyre,
            "stint": lap.stint,
            "position": lap.position,
            "isPitLap": lap.is_pit_lap,
            "isAccurate": lap.is_accurate,
            "isPersonalBest": lap.is_personal_best,
            "deleted": lap.deleted,
            "deltaToFastest": lap.delta_to_fastest,
        })
    return laps_json


@app.get("/races/{year}/{round_number}/{driver_code}/laps/{lap_number}")
def read_laps(year: int, round_number: int, driver_code: str, lap_number: int):
    race = Race.get_or_none((Race.round_number == round_number) & (Race.year == year))
    if not race:
        return {"error": "Race not found"}
    entry = RaceEntry.select().where((RaceEntry.race == race) & (RaceEntry.driver_code == driver_code)).first()
    lap: Lap = Lap.select().where((Lap.entry == entry) & (Lap.lap_number == lap_number)).first()
    if not lap:
        return {"error": "Lap not found"}
    lap_json = {
        "lapNumber": lap.lap_number,
        "lapTime": lap.lap_time_seconds,
        "sector1Time": lap.sector1_seconds,
        "sector2Time": lap.sector2_seconds,
        "sector3Time": lap.sector3_seconds,
        "compound": lap.compound,
        "tyreLife": lap.tyre_life,
        "freshTyre": lap.fresh_tyre,
        "stint": lap.stint,
        "position": lap.position,
        "isPitLap": lap.is_pit_lap,
        "isAccurate": lap.is_accurate,
        "isPersonalBest": lap.is_personal_best,
        "deleted": lap.deleted,
        "deltaToFastest": lap.delta_to_fastest,
    }
    return lap_json


@app.get("/races/{year}/{round_number}/{driver_code}/laps/{lap_number}/telemetry")
def read_lap_telemetry(year: int, round_number: int, driver_code: str, lap_number: int):
    session = fastf1.get_session(year, round_number, "R")
    session.load()
    lap = session.laps.pick_drivers(driver_code).pick_laps(lap_number)
    telemetry = lap.telemetry
    telemetry_json = []
    for tel in telemetry.iterrows():
        info = tel[1]
        telemetry_json.append({
            "date": info["Date"],
            "sessionTime": info["SessionTime"],
            "speed": info["Speed"],
            "rpm": info["RPM"],
            "gear": info["nGear"],
            "throttle": info["Throttle"],
            "brake": info["Brake"],
            "drs": info["DRS"],
            "driverAhead": info["DriverAhead"],
            "distanceToDriverAhead": info["DistanceToDriverAhead"],
            "time": info["Time"],
            "distance": info["Distance"],
            "relativeDistance": info["RelativeDistance"],
            "x": info["X"],
            "y": info["Y"],
            "z": info["Z"],
        })
    return telemetry_json


@app.get("/races/{year}/{round_number}/result")
def read_race_results(round_number: int, year: int):
    race = fastf1.get_session(year, round_number, "R")
    race.load()
    result = race.results
    result_json = []
    for result in result.iterrows():
        info = result[1]
        result_json.append({
            "driverName": info["FullName"],
            "driverCode": info["Abbreviation"],
            "driverNumber": info["DriverNumber"],
            "driverId": info["DriverId"],
            "teamName": info["TeamName"],
            "teamColor": info["TeamColor"],
            "countryCode": info["CountryCode"],
            "position": info["Position"],
            "gridPosition": info["GridPosition"],
            "classifiedPosition": info["ClassifiedPosition"],
            "status": info["Status"],
            "points": info["Points"],
        })
    return result_json
