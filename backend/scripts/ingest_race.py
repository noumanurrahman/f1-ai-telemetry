import fastf1
import pandas as pd

from db.models import Race, RaceEntry, Lap


def main():
    grand_prix = input("Enter the Grand Prix: ")
    year = int(input("Enter the Year: "))
    print(f"Ingesting {year}'s {grand_prix} Grand Prix")
    session = fastf1.get_session(year, grand_prix, "R")
    session.load()
    race = insert_race(session)
    insert_drivers(session, race[0])
    drivers = session.laps["Driver"].unique()
    for driver in drivers:
        insert_laps(session, driver)


def insert_race(session) -> tuple[Race, bool]:
    return Race.get_or_create(
        year=session.date.year,
        event_name=session.session_info["Meeting"]["Name"],
        total_laps=session.total_laps,
        race_date=session.date.to_pydatetime(),
        official_name=session.session_info["Meeting"]["OfficialName"],
        location=session.session_info["Meeting"]["Location"],
        country=session.session_info["Meeting"]["Country"]["Name"],
        round_number=session.event["RoundNumber"],
    )


# Insert Drivers' Race Entry
def insert_drivers(session, race: Race):
    bulk_drivers = []
    for driver in session.drivers:
        driver_info = session.get_driver(driver)
        driver_number = driver
        team_name = driver_info["TeamName"]
        grid_pos = driver_info["GridPosition"]
        position = driver_info["Position"]
        classified_pos = driver_info["ClassifiedPosition"]
        status = driver_info["Status"]
        points = driver_info["Points"]
        race_entry = RaceEntry.get_or_create(
            race=race,
            driver_number=driver_number,
            driver_code=driver_info["Abbreviation"],
            first_name=driver_info["FirstName"],
            last_name=driver_info["LastName"],
            full_name=driver_info["FullName"],
            headshot_url=driver_info["HeadshotUrl"],
            team_name=team_name,
            grid_position=grid_pos,
            finish_position=position,
            classified_position=classified_pos,
            status=status,
            points=points
        )
        bulk_drivers.append(race_entry)
    return bulk_drivers


def insert_laps(session, driver):
    laps = session.laps.pick_drivers(driver)
    final_laps = []
    for lap in laps.iterlaps():
        lap_info = lap[1]
        final_laps.append(Lap.create(
            entry=RaceEntry.get(RaceEntry.driver_code == driver),
            lap_number=lap_info["LapNumber"],
            lap_time_seconds=lap_info["LapTime"].total_seconds() if lap_info["LapTime"] else None,
            sector1_seconds=lap_info["Sector1Time"].total_seconds() if lap_info["Sector1Time"] else None,
            sector2_seconds=lap_info["Sector2Time"].total_seconds() if lap_info["Sector2Time"] else None,
            sector3_seconds=lap_info["Sector3Time"].total_seconds() if lap_info["Sector3Time"] else None,
            compound=lap_info["Compound"],
            tyre_life=lap_info["TyreLife"],
            fresh_tyre=lap_info["FreshTyre"],
            is_pit_lap=False if pd.isnull(lap_info["PitInTime"]) else True,
            stint=lap_info["Stint"],
            position=lap_info["Position"],
            is_personal_best=lap_info["IsPersonalBest"],
            is_accurate=lap_info["IsAccurate"]
        ))
    return final_laps


main()
