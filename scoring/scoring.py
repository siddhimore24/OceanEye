from integration.scoring_validation import validate_ranking_candidate


def calculate_overall_score(
    distance_score,
    temporal_score,
    trajectory_score=0.0,
):
    """
    Calculate a weighted vessel attribution score.

    All input scores are expected to be between 0 and 1.
    """

    overall_score = (
        0.40 * distance_score
        + 0.30 * temporal_score
        + 0.30 * trajectory_score
    )

    return round(max(0.0, min(1.0, overall_score)), 4)


def rank_vessel_candidates(candidates):
    """
    Rank AIS vessel candidates and return contract-compliant results.

    Higher overall score = stronger candidate.
    This is a probability/ranking aid, NOT a declaration of guilt.
    """

    ranked = []

    for candidate in candidates:
        overall_score = calculate_overall_score(
            candidate.get("distance_score", 0.0),
            candidate.get("temporal_score", 0.0),
            candidate.get("trajectory_score", 0.0),
        )

        confidence = round(
            (
                overall_score
                + candidate.get("temporal_score", 0.0)
                + candidate.get("trajectory_score", 0.0)
            ) / 3,
            4,
        )

        result = {
            "mmsi": candidate["mmsi"],
            "rank": 0,
            "overall_score": overall_score,
            "score_components": {
                "distance_score": candidate.get("distance_score", 0.0),
                "temporal_score": candidate.get("temporal_score", 0.0),
                "trajectory_score": candidate.get("trajectory_score", 0.0),
            },
            "reasons": [
                "Vessel was temporally compatible with the spill",
                "Vessel was geographically compatible with the source zone",
            ],
            "confidence": confidence,
            "uncertainty": candidate.get(
                "uncertainty",
                "Attribution uncertainty remains; AIS coverage and model assumptions may affect ranking.",
            ),
            "data_provenance": candidate.get(
                "data_provenance",
                "AIS candidate correlation",
            ),
        }

        ranked.append(result)

    ranked.sort(
        key=lambda item: item["overall_score"],
        reverse=True,
    )

    for rank, candidate in enumerate(ranked, start=1):
        candidate["rank"] = rank

    return ranked


def score_and_validate(candidates):
    """
    Rank candidates and validate every scoring output.
    """

    ranked = rank_vessel_candidates(candidates)

    for candidate in ranked:
        valid, error = validate_ranking_candidate(candidate)

        if not valid:
            return {
                "status": "error",
                "error": error,
            }

    return {
        "status": "success",
        "ranking": ranked,
    }
