from peewee import fn

from db.models import db, RaceEntry, Lap

with db.atomic():
    for entry in RaceEntry.select():
        # Compute averages for this driver
        avg_s1 = (
            Lap.select(fn.AVG(Lap.sector1_seconds))
            .where(
                (Lap.entry == entry) &
                Lap.sector1_seconds.is_null(False)
            )
            .scalar()
        )

        avg_s2 = (
            Lap.select(fn.AVG(Lap.sector2_seconds))
            .where(
                (Lap.entry == entry) &
                Lap.sector2_seconds.is_null(False)
            )
            .scalar()
        )

        avg_s3 = (
            Lap.select(fn.AVG(Lap.sector3_seconds))
            .where(
                (Lap.entry == entry) &
                Lap.sector3_seconds.is_null(False)
            )
            .scalar()
        )

        if avg_s1 is not None:
            updated = (
                Lap.update(sector1_seconds=avg_s1)
                .where(
                    (Lap.entry == entry) &
                    Lap.sector1_seconds.is_null(True)
                )
                .execute()
            )
            if updated:
                print(f"{entry.full_name}: filled {updated} Sector 1 values")

        if avg_s2 is not None:
            updated = (
                Lap.update(sector2_seconds=avg_s2)
                .where(
                    (Lap.entry == entry) &
                    Lap.sector2_seconds.is_null(True)
                )
                .execute()
            )
            if updated:
                print(f"{entry.full_name}: filled {updated} Sector 2 values")

        if avg_s3 is not None:
            updated = (
                Lap.update(sector3_seconds=avg_s3)
                .where(
                    (Lap.entry == entry) &
                    Lap.sector3_seconds.is_null(True)
                )
                .execute()
            )
            if updated:
                print(f"{entry.full_name}: filled {updated} Sector 3 values")

print("Done!")
