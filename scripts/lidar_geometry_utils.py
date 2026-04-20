"""
Shared geometry utilities for Tier 3 pipelines (A, B, C).

Round-3 cleanup (Session BH): extracted alpha_shape_perimeter from
lidar-tier3-geometry.py so Pipelines B and C can call the same perimeter
definition. The 26% A↔B/C perimeter gap in round 2 was alpha-shape vs
convex-hull definitional, not algorithmic error. Standardizing on alpha-shape
(the more-accurate-for-roofing definition) closes the cross-val flag.
"""
import numpy as np
from scipy.spatial import ConvexHull, Delaunay


def alpha_shape_perimeter(points_2d):
    """Auto-alpha = 2 * sqrt(hull_area/N). Returns (perimeter_ft, alpha_area_sqft, flags)."""
    flags = {}
    if len(points_2d) < 4:
        return 0.0, 0.0, {"too_few_points": True}
    try:
        hull = ConvexHull(points_2d)
        hull_area = float(hull.volume)  # 2D volume == area
    except Exception:
        return 0.0, 0.0, {"convex_hull_failed": True}
    s = np.sqrt(hull_area / len(points_2d))
    alpha = 2.0 * s
    try:
        tri = Delaunay(points_2d)
    except Exception:
        flags["delaunay_failed"] = True
        return _convex_hull_perimeter(points_2d), hull_area, {**flags, "alpha_shape_fallback_hull": True}
    alpha_edge_count = {}
    area_sum = 0.0
    kept_triangles = 0
    for simplex in tri.simplices:
        pa, pb, pc = points_2d[simplex[0]], points_2d[simplex[1]], points_2d[simplex[2]]
        cr = _circumradius(pa, pb, pc)
        if cr is None or cr > alpha:
            continue
        kept_triangles += 1
        area_sum += 0.5 * abs((pb[0]-pa[0])*(pc[1]-pa[1]) - (pc[0]-pa[0])*(pb[1]-pa[1]))
        for a, b in ((simplex[0], simplex[1]), (simplex[1], simplex[2]), (simplex[2], simplex[0])):
            key = tuple(sorted([int(a), int(b)]))
            alpha_edge_count[key] = alpha_edge_count.get(key, 0) + 1
    if kept_triangles == 0:
        flags["no_alpha_triangles"] = True
        return _convex_hull_perimeter(points_2d), hull_area, {**flags, "alpha_shape_fallback_hull": True}
    boundary_edges = [k for k, v in alpha_edge_count.items() if v == 1]
    if not boundary_edges:
        flags["no_alpha_boundary"] = True
        return _convex_hull_perimeter(points_2d), hull_area, {**flags, "alpha_shape_fallback_hull": True}
    perim = 0.0
    for (a, b) in boundary_edges:
        perim += float(np.linalg.norm(points_2d[a] - points_2d[b]))
    if area_sum < 0.7 * hull_area:
        flags["alpha_too_fragmented"] = True
        return _convex_hull_perimeter(points_2d), hull_area, {**flags, "alpha_shape_fallback_hull": True}
    flags["alpha_used"] = round(alpha, 2)
    return float(perim), float(area_sum), flags


def _circumradius(pa, pb, pc):
    a = np.linalg.norm(pb - pc); b = np.linalg.norm(pa - pc); c = np.linalg.norm(pa - pb)
    s = (a + b + c) / 2
    area = max(1e-12, (s*(s-a)*(s-b)*(s-c)))
    if area <= 0:
        return None
    return float((a * b * c) / (4 * np.sqrt(area)))


def _convex_hull_perimeter(points_2d):
    try:
        hull = ConvexHull(points_2d)
        pts = points_2d[hull.vertices]
        perim = 0.0
        for i in range(len(pts)):
            perim += float(np.linalg.norm(pts[i] - pts[(i+1) % len(pts)]))
        return perim
    except Exception:
        return 0.0
