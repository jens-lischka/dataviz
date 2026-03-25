"""Tests for connector validation."""

import pytest

from conftest import make_slide_xml
from slide_transpiler.connectors import InvalidConnectorError, validate_connectors


def test_valid_connector_passes():
    xml = make_slide_xml(shapes=2, has_connector=True, connector_valid=True)
    result = validate_connectors(xml)
    assert result == xml  # Should pass through unchanged


def test_invalid_connector_raises():
    xml = make_slide_xml(shapes=2, has_connector=True, connector_valid=False)
    with pytest.raises(InvalidConnectorError):
        validate_connectors(xml)


def test_no_connectors_passes():
    xml = make_slide_xml(shapes=2, has_connector=False)
    result = validate_connectors(xml)
    assert result == xml
