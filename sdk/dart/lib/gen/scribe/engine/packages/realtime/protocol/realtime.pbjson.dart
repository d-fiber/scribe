// This is a generated file - do not edit.
//
// Generated from scribe/engine/packages/realtime/protocol/realtime.proto.

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

@$core.Deprecated('Use broadcastRequestDescriptor instead')
const BroadcastRequest$json = {
  '1': 'BroadcastRequest',
  '2': [
    {'1': 'channel', '3': 1, '4': 1, '5': 9, '10': 'channel'},
    {'1': 'action', '3': 2, '4': 1, '5': 9, '10': 'action'},
    {'1': 'entity_id', '3': 3, '4': 1, '5': 9, '10': 'entityId'},
    {
      '1': 'payload',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'payload'
    },
  ],
};

/// Descriptor for `BroadcastRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List broadcastRequestDescriptor = $convert.base64Decode(
    'ChBCcm9hZGNhc3RSZXF1ZXN0EhgKB2NoYW5uZWwYASABKAlSB2NoYW5uZWwSFgoGYWN0aW9uGA'
    'IgASgJUgZhY3Rpb24SGwoJZW50aXR5X2lkGAMgASgJUghlbnRpdHlJZBIpCgdwYXlsb2FkGAQg'
    'ASgLMg8uc2NyaWJlLnYxLkpzb25SB3BheWxvYWQ=');

@$core.Deprecated('Use broadcastResultDescriptor instead')
const BroadcastResult$json = {
  '1': 'BroadcastResult',
  '2': [
    {'1': 'delivered', '3': 1, '4': 1, '5': 13, '10': 'delivered'},
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

/// Descriptor for `BroadcastResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List broadcastResultDescriptor = $convert.base64Decode(
    'Cg9Ccm9hZGNhc3RSZXN1bHQSHAoJZGVsaXZlcmVkGAEgASgNUglkZWxpdmVyZWQSKAoFZXJyb3'
    'IYAiABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use grantRequestDescriptor instead')
const GrantRequest$json = {
  '1': 'GrantRequest',
  '2': [
    {'1': 'channel', '3': 1, '4': 1, '5': 9, '10': 'channel'},
    {'1': 'account_ids', '3': 2, '4': 3, '5': 9, '10': 'accountIds'},
  ],
};

/// Descriptor for `GrantRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List grantRequestDescriptor = $convert.base64Decode(
    'CgxHcmFudFJlcXVlc3QSGAoHY2hhbm5lbBgBIAEoCVIHY2hhbm5lbBIfCgthY2NvdW50X2lkcx'
    'gCIAMoCVIKYWNjb3VudElkcw==');

@$core.Deprecated('Use grantResultDescriptor instead')
const GrantResult$json = {
  '1': 'GrantResult',
  '2': [
    {
      '1': 'error',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Failure',
      '10': 'error'
    },
  ],
};

/// Descriptor for `GrantResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List grantResultDescriptor = $convert.base64Decode(
    'CgtHcmFudFJlc3VsdBIoCgVlcnJvchgBIAEoCzISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg'
    '==');

const $core.Map<$core.String, $core.dynamic> RealtimeServiceBase$json = {
  '1': 'Realtime',
  '2': [
    {
      '1': 'Broadcast',
      '2': '.scribe.clients.realtime.v1.BroadcastRequest',
      '3': '.scribe.clients.realtime.v1.BroadcastResult'
    },
    {
      '1': 'Grant',
      '2': '.scribe.clients.realtime.v1.GrantRequest',
      '3': '.scribe.clients.realtime.v1.GrantResult'
    },
    {
      '1': 'Revoke',
      '2': '.scribe.clients.realtime.v1.GrantRequest',
      '3': '.scribe.clients.realtime.v1.GrantResult'
    },
  ],
};

@$core.Deprecated('Use realtimeServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RealtimeServiceBase$messageJson = {
  '.scribe.clients.realtime.v1.BroadcastRequest': BroadcastRequest$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.realtime.v1.BroadcastResult': BroadcastResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.realtime.v1.GrantRequest': GrantRequest$json,
  '.scribe.clients.realtime.v1.GrantResult': GrantResult$json,
};

/// Descriptor for `Realtime`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List realtimeServiceDescriptor = $convert.base64Decode(
    'CghSZWFsdGltZRJmCglCcm9hZGNhc3QSLC5zY3JpYmUuY2xpZW50cy5yZWFsdGltZS52MS5Ccm'
    '9hZGNhc3RSZXF1ZXN0Gisuc2NyaWJlLmNsaWVudHMucmVhbHRpbWUudjEuQnJvYWRjYXN0UmVz'
    'dWx0EloKBUdyYW50Eiguc2NyaWJlLmNsaWVudHMucmVhbHRpbWUudjEuR3JhbnRSZXF1ZXN0Gi'
    'cuc2NyaWJlLmNsaWVudHMucmVhbHRpbWUudjEuR3JhbnRSZXN1bHQSWwoGUmV2b2tlEiguc2Ny'
    'aWJlLmNsaWVudHMucmVhbHRpbWUudjEuR3JhbnRSZXF1ZXN0Gicuc2NyaWJlLmNsaWVudHMucm'
    'VhbHRpbWUudjEuR3JhbnRSZXN1bHQ=');
