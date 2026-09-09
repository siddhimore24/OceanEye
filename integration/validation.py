def validate_required_fields(data, required_fields):
    return [
        field
        for field in required_fields
        if field not in data
    ]


def validate_confidence(confidence):
    return 0 <= confidence <= 1


def validate_latitude(latitude):
    return -90 <= latitude <= 90


def validate_longitude(longitude):
    return -180 <= longitude <= 180


def validate_non_negative(value):
    return value >= 0