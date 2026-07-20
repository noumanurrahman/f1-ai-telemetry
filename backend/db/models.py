import datetime

import peewee as pw

db = pw.SqliteDatabase("database.db")


class BaseModel(pw.Model):
    class Meta:
        database = db


class Race(BaseModel):
    year = pw.IntegerField()
    round_number = pw.IntegerField()
    event_name = pw.CharField()  # e.g. "Bahrain Grand Prix"
    official_name = pw.CharField(null=True)  # sponsor-heavy official name
    country = pw.CharField()
    location = pw.CharField()  # city/region, e.g. "Sakhir"
    race_date = pw.DateTimeField()  # the Race session's date/time
    total_laps = pw.IntegerField(null=True)  # filled in after parsing session.laps

    class Meta:
        indexes = ((("year", "round_number"), True),)  # unique per season+round


class RaceEntry(BaseModel):
    race = pw.ForeignKeyField(Race, backref="entries", on_delete="CASCADE")
    driver_code = pw.CharField(index=True)
    driver_number = pw.CharField(null=True)
    first_name = pw.CharField()
    last_name = pw.CharField()
    full_name = pw.CharField()
    headshot_url = pw.CharField(null=True)
    team_name = pw.CharField()
    grid_position = pw.IntegerField(null=True)
    finish_position = pw.IntegerField(null=True)
    classified_position = pw.CharField(null=True)  # 'DNF' / 'DSQ' / 'NC' etc.
    status = pw.CharField(null=True)  # 'Finished', '+1 Lap', 'Accident'...
    points = pw.FloatField(null=True)

    class Meta:
        indexes = ((("race", "driver_code"), True),)
        table_name = "race_entry"


class Lap(BaseModel):
    entry = pw.ForeignKeyField(RaceEntry, backref="laps", on_delete="CASCADE")
    lap_number = pw.IntegerField()
    lap_time_seconds = pw.FloatField(null=True)  # null if incomplete (e.g. red flag)
    sector1_seconds = pw.FloatField(null=True)
    sector2_seconds = pw.FloatField(null=True)
    sector3_seconds = pw.FloatField(null=True)
    compound = pw.CharField(null=True)  # SOFT / MEDIUM / HARD / INTERMEDIATE / WET
    tyre_life = pw.IntegerField(null=True)
    fresh_tyre = pw.BooleanField(null=True)
    stint = pw.IntegerField(null=True)
    position = pw.IntegerField(null=True)  # track position at end of this lap
    is_personal_best = pw.BooleanField(default=False)
    is_accurate = pw.BooleanField(default=True)  # FastF1's own validity flag
    deleted = pw.BooleanField(default=False)  # e.g. track limits infringement
    is_pit_lap = pw.BooleanField(default=False)  # PitInTime or PitOutTime was set
    delta_to_fastest = pw.FloatField(null=True)


class AICoachingCache(BaseModel):
    lap = pw.ForeignKeyField(Lap, backref="coaching", unique=True, on_delete="CASCADE")
    feature_summary_json = pw.TextField()  # structured features sent to Claude - never raw telemetry
    narrative = pw.TextField()  # Claude's generated coaching text
    claude_model = pw.CharField()  # e.g. "claude-sonnet-4-6" - for your own reference
    created_at = pw.DateTimeField(default=datetime.datetime.utcnow)

    class Meta:
        table_name = "ai_coaching_cache"


def init_db() -> None:
    db.connect(reuse_if_open=True)
    db.create_tables([Race, RaceEntry, Lap, AICoachingCache])
