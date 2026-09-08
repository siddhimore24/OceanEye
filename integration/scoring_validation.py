    from tests.validation import (
    validate_confidence,
    validate_non_negative,
    validate_required_fields,
)


def validate_ranking_candidate(candidate):
    """Validate one scoring/ranking output candidate."""

    required_fields = [
        "mmsi",
        "rank",
        "overall_score",
        "score_components",
        "reasons",
        "confidence",
        "uncertainty",
        "data_provenance",
    ]

    missing_fields = validate_required_fields(
        candidate,
        required_fields,
    )

    if missing_fields:
        return False, {
            "stage": "scoring",
            "missing_fields": missing_fields,
        }

    if candidate["rank"] < 1:
        return False, {
            "stage": "scoring",
            "message": "Invalid rank",
        }

    if not validate_confidence(
        candidate["overall_score"]
    ):
        return False, {
            "stage": "scoring",
            "message": "Invalid overall score",
        }

    if not validate_confidence(
        candidate["confidence"]
    ):
        return False, {
            "stage": "scoring",
            "message": "Invalid confidence",
        }

    return True, None