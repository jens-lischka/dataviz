"""Connector validation — ensure connector shapes have valid bindings."""

import xml.etree.ElementTree as ET

from .namespaces import NS


class InvalidConnectorError(Exception):
    """Raised when a connector shape is missing start or end connection."""

    pass


def validate_connectors(xml: bytes) -> bytes:
    """Validate that all connector shapes have proper start/end connections.

    Each <p:cxnSp> must contain both:
    - <a:stCxn id="X" idx="N"/>  (start connection)
    - <a:endCxn id="Y" idx="N"/> (end connection)

    Args:
        xml: Slide XML bytes.

    Returns:
        The same XML bytes if validation passes.

    Raises:
        InvalidConnectorError: If any connector is missing connections.
    """
    root = ET.fromstring(xml)

    for cxn_sp in root.iter("{%s}cxnSp" % NS["p"]):
        st = cxn_sp.find(".//{%s}stCxn" % NS["a"])
        en = cxn_sp.find(".//{%s}endCxn" % NS["a"])

        if st is None or en is None:
            # Extract shape name for debugging
            nv_props = cxn_sp.find(".//{%s}cNvPr" % NS["p"])
            name = "unknown"
            if nv_props is not None:
                name = nv_props.attrib.get("name", "unknown")

            missing = []
            if st is None:
                missing.append("stCxn (start)")
            if en is None:
                missing.append("endCxn (end)")

            raise InvalidConnectorError(
                f"Connector '{name}' is missing: {', '.join(missing)}. "
                f"Connectors must have both start and end connection points."
            )

    return xml
