from peewee import fn

from db.models import db, RaceEntry, Lap

with db.atomic():
    for entry in RaceEntry.select():
        avg = (
            Lap.select(fn.AVG(Lap.lap_time_seconds))
            .where(
                (Lap.entry == entry) &
                Lap.lap_time_seconds.is_null(False)
            )
            .scalar()
        )

        if avg is None:
            continue

        updated = (
            Lap.update(lap_time_seconds=avg)
            .where(
                (Lap.entry == entry) &
                Lap.lap_time_seconds.is_null(True)
            )
            .execute()
        )

        if updated:
            print(f"{entry.full_name}: updated {updated} laps")
