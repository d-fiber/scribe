// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/geospatial/protocol/geospatial.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports
// ignore_for_file: unused_import

import 'dart:convert' as $convert;
import 'dart:core' as $core;
import 'dart:typed_data' as $typed_data;

import '../../../../protocol/common.pbjson.dart' as $0;

@$core.Deprecated('Use addressDescriptor instead')
const Address$json = {
  '1': 'Address',
  '2': [
    {'1': 'street', '3': 1, '4': 1, '5': 9, '10': 'street'},
    {'1': 'city', '3': 2, '4': 1, '5': 9, '10': 'city'},
    {'1': 'postal_code', '3': 3, '4': 1, '5': 9, '10': 'postalCode'},
    {'1': 'country', '3': 4, '4': 1, '5': 9, '10': 'country'},
  ],
};

/// Descriptor for `Address`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List addressDescriptor = $convert.base64Decode(
    'CgdBZGRyZXNzEhYKBnN0cmVldBgBIAEoCVIGc3RyZWV0EhIKBGNpdHkYAiABKAlSBGNpdHkSHw'
    'oLcG9zdGFsX2NvZGUYAyABKAlSCnBvc3RhbENvZGUSGAoHY291bnRyeRgEIAEoCVIHY291bnRy'
    'eQ==');

@$core.Deprecated('Use coordinatesDescriptor instead')
const Coordinates$json = {
  '1': 'Coordinates',
  '2': [
    {'1': 'lat', '3': 1, '4': 1, '5': 1, '10': 'lat'},
    {'1': 'lng', '3': 2, '4': 1, '5': 1, '10': 'lng'},
  ],
};

/// Descriptor for `Coordinates`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List coordinatesDescriptor = $convert.base64Decode(
    'CgtDb29yZGluYXRlcxIQCgNsYXQYASABKAFSA2xhdBIQCgNsbmcYAiABKAFSA2xuZw==');

@$core.Deprecated('Use geocodeRequestDescriptor instead')
const GeocodeRequest$json = {
  '1': 'GeocodeRequest',
  '2': [
    {'1': 'query', '3': 1, '4': 1, '5': 9, '10': 'query'},
    {'1': 'region', '3': 2, '4': 1, '5': 9, '10': 'region'},
  ],
};

/// Descriptor for `GeocodeRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List geocodeRequestDescriptor = $convert.base64Decode(
    'Cg5HZW9jb2RlUmVxdWVzdBIUCgVxdWVyeRgBIAEoCVIFcXVlcnkSFgoGcmVnaW9uGAIgASgJUg'
    'ZyZWdpb24=');

@$core.Deprecated('Use geocodeResultDescriptor instead')
const GeocodeResult$json = {
  '1': 'GeocodeResult',
  '2': [
    {
      '1': 'coordinates',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.geospatial.v1.Coordinates',
      '10': 'coordinates'
    },
    {
      '1': 'address',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.geospatial.v1.Address',
      '10': 'address'
    },
    {
      '1': 'error',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Failure',
      '10': 'error'
    },
  ],
};

/// Descriptor for `GeocodeResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List geocodeResultDescriptor = $convert.base64Decode(
    'Cg1HZW9jb2RlUmVzdWx0EksKC2Nvb3JkaW5hdGVzGAEgASgLMikuc2NyaWJlLmNsaWVudHMuZ2'
    'Vvc3BhdGlhbC52MS5Db29yZGluYXRlc1ILY29vcmRpbmF0ZXMSPwoHYWRkcmVzcxgCIAEoCzIl'
    'LnNjcmliZS5jbGllbnRzLmdlb3NwYXRpYWwudjEuQWRkcmVzc1IHYWRkcmVzcxIoCgVlcnJvch'
    'gDIAEoCzISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use reverseGeocodeRequestDescriptor instead')
const ReverseGeocodeRequest$json = {
  '1': 'ReverseGeocodeRequest',
  '2': [
    {
      '1': 'coordinates',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.geospatial.v1.Coordinates',
      '10': 'coordinates'
    },
  ],
};

/// Descriptor for `ReverseGeocodeRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List reverseGeocodeRequestDescriptor = $convert.base64Decode(
    'ChVSZXZlcnNlR2VvY29kZVJlcXVlc3QSSwoLY29vcmRpbmF0ZXMYASABKAsyKS5zY3JpYmUuY2'
    'xpZW50cy5nZW9zcGF0aWFsLnYxLkNvb3JkaW5hdGVzUgtjb29yZGluYXRlcw==');

@$core.Deprecated('Use reverseGeocodeResultDescriptor instead')
const ReverseGeocodeResult$json = {
  '1': 'ReverseGeocodeResult',
  '2': [
    {
      '1': 'address',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.geospatial.v1.Address',
      '10': 'address'
    },
    {
      '1': 'error',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Failure',
      '10': 'error'
    },
  ],
};

/// Descriptor for `ReverseGeocodeResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List reverseGeocodeResultDescriptor = $convert.base64Decode(
    'ChRSZXZlcnNlR2VvY29kZVJlc3VsdBI/CgdhZGRyZXNzGAEgASgLMiUuc2NyaWJlLmNsaWVudH'
    'MuZ2Vvc3BhdGlhbC52MS5BZGRyZXNzUgdhZGRyZXNzEigKBWVycm9yGAIgASgLMhIuc2NyaWJl'
    'LnYxLkZhaWx1cmVSBWVycm9y');

const $core.Map<$core.String, $core.dynamic> GeospatialServiceBase$json = {
  '1': 'Geospatial',
  '2': [
    {
      '1': 'Geocode',
      '2': '.scribe.clients.geospatial.v1.GeocodeRequest',
      '3': '.scribe.clients.geospatial.v1.GeocodeResult'
    },
    {
      '1': 'ReverseGeocode',
      '2': '.scribe.clients.geospatial.v1.ReverseGeocodeRequest',
      '3': '.scribe.clients.geospatial.v1.ReverseGeocodeResult'
    },
  ],
};

@$core.Deprecated('Use geospatialServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    GeospatialServiceBase$messageJson = {
  '.scribe.clients.geospatial.v1.GeocodeRequest': GeocodeRequest$json,
  '.scribe.clients.geospatial.v1.GeocodeResult': GeocodeResult$json,
  '.scribe.clients.geospatial.v1.Coordinates': Coordinates$json,
  '.scribe.clients.geospatial.v1.Address': Address$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.geospatial.v1.ReverseGeocodeRequest':
      ReverseGeocodeRequest$json,
  '.scribe.clients.geospatial.v1.ReverseGeocodeResult':
      ReverseGeocodeResult$json,
};

/// Descriptor for `Geospatial`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List geospatialServiceDescriptor = $convert.base64Decode(
    'CgpHZW9zcGF0aWFsEmQKB0dlb2NvZGUSLC5zY3JpYmUuY2xpZW50cy5nZW9zcGF0aWFsLnYxLk'
    'dlb2NvZGVSZXF1ZXN0Gisuc2NyaWJlLmNsaWVudHMuZ2Vvc3BhdGlhbC52MS5HZW9jb2RlUmVz'
    'dWx0EnkKDlJldmVyc2VHZW9jb2RlEjMuc2NyaWJlLmNsaWVudHMuZ2Vvc3BhdGlhbC52MS5SZX'
    'ZlcnNlR2VvY29kZVJlcXVlc3QaMi5zY3JpYmUuY2xpZW50cy5nZW9zcGF0aWFsLnYxLlJldmVy'
    'c2VHZW9jb2RlUmVzdWx0');
