// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/database/realtime/protocol/realtime.proto.

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

import '../../../../../protocol/common.pbjson.dart' as $0;

@$core.Deprecated('Use targetDescriptor instead')
const Target$json = {
  '1': 'Target',
  '2': [
    {
      '1': 'scope',
      '3': 1,
      '4': 1,
      '5': 14,
      '6': '.scribe.v1.EventScope',
      '10': 'scope'
    },
    {'1': 'ids', '3': 2, '4': 3, '5': 9, '10': 'ids'},
    {'1': 'topic', '3': 3, '4': 1, '5': 9, '10': 'topic'},
  ],
};

/// Descriptor for `Target`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List targetDescriptor = $convert.base64Decode(
    'CgZUYXJnZXQSKwoFc2NvcGUYASABKA4yFS5zY3JpYmUudjEuRXZlbnRTY29wZVIFc2NvcGUSEA'
    'oDaWRzGAIgAygJUgNpZHMSFAoFdG9waWMYAyABKAlSBXRvcGlj');

@$core.Deprecated('Use broadcastRequestDescriptor instead')
const BroadcastRequest$json = {
  '1': 'BroadcastRequest',
  '2': [
    {'1': 'entity', '3': 1, '4': 1, '5': 9, '10': 'entity'},
    {'1': 'event', '3': 2, '4': 1, '5': 9, '10': 'event'},
    {
      '1': 'target',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.realtime.v1.Target',
      '10': 'target'
    },
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
    'ChBCcm9hZGNhc3RSZXF1ZXN0EhYKBmVudGl0eRgBIAEoCVIGZW50aXR5EhQKBWV2ZW50GAIgAS'
    'gJUgVldmVudBI6CgZ0YXJnZXQYAyABKAsyIi5zY3JpYmUuY2xpZW50cy5yZWFsdGltZS52MS5U'
    'YXJnZXRSBnRhcmdldBIpCgdwYXlsb2FkGAQgASgLMg8uc2NyaWJlLnYxLkpzb25SB3BheWxvYW'
    'Q=');

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

@$core.Deprecated('Use topicMembershipRequestDescriptor instead')
const TopicMembershipRequest$json = {
  '1': 'TopicMembershipRequest',
  '2': [
    {'1': 'topic', '3': 1, '4': 1, '5': 9, '10': 'topic'},
    {'1': 'member_ids', '3': 2, '4': 3, '5': 9, '10': 'memberIds'},
  ],
};

/// Descriptor for `TopicMembershipRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List topicMembershipRequestDescriptor =
    $convert.base64Decode(
        'ChZUb3BpY01lbWJlcnNoaXBSZXF1ZXN0EhQKBXRvcGljGAEgASgJUgV0b3BpYxIdCgptZW1iZX'
        'JfaWRzGAIgAygJUgltZW1iZXJJZHM=');

@$core.Deprecated('Use topicMembershipResultDescriptor instead')
const TopicMembershipResult$json = {
  '1': 'TopicMembershipResult',
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

/// Descriptor for `TopicMembershipResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List topicMembershipResultDescriptor = $convert.base64Decode(
    'ChVUb3BpY01lbWJlcnNoaXBSZXN1bHQSKAoFZXJyb3IYASABKAsyEi5zY3JpYmUudjEuRmFpbH'
    'VyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> RealtimeServiceBase$json = {
  '1': 'Realtime',
  '2': [
    {
      '1': 'Broadcast',
      '2': '.scribe.clients.realtime.v1.BroadcastRequest',
      '3': '.scribe.clients.realtime.v1.BroadcastResult'
    },
    {
      '1': 'JoinTopic',
      '2': '.scribe.clients.realtime.v1.TopicMembershipRequest',
      '3': '.scribe.clients.realtime.v1.TopicMembershipResult'
    },
    {
      '1': 'LeaveTopic',
      '2': '.scribe.clients.realtime.v1.TopicMembershipRequest',
      '3': '.scribe.clients.realtime.v1.TopicMembershipResult'
    },
  ],
};

@$core.Deprecated('Use realtimeServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RealtimeServiceBase$messageJson = {
  '.scribe.clients.realtime.v1.BroadcastRequest': BroadcastRequest$json,
  '.scribe.clients.realtime.v1.Target': Target$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.realtime.v1.BroadcastResult': BroadcastResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.realtime.v1.TopicMembershipRequest':
      TopicMembershipRequest$json,
  '.scribe.clients.realtime.v1.TopicMembershipResult':
      TopicMembershipResult$json,
};

/// Descriptor for `Realtime`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List realtimeServiceDescriptor = $convert.base64Decode(
    'CghSZWFsdGltZRJmCglCcm9hZGNhc3QSLC5zY3JpYmUuY2xpZW50cy5yZWFsdGltZS52MS5Ccm'
    '9hZGNhc3RSZXF1ZXN0Gisuc2NyaWJlLmNsaWVudHMucmVhbHRpbWUudjEuQnJvYWRjYXN0UmVz'
    'dWx0EnIKCUpvaW5Ub3BpYxIyLnNjcmliZS5jbGllbnRzLnJlYWx0aW1lLnYxLlRvcGljTWVtYm'
    'Vyc2hpcFJlcXVlc3QaMS5zY3JpYmUuY2xpZW50cy5yZWFsdGltZS52MS5Ub3BpY01lbWJlcnNo'
    'aXBSZXN1bHQScwoKTGVhdmVUb3BpYxIyLnNjcmliZS5jbGllbnRzLnJlYWx0aW1lLnYxLlRvcG'
    'ljTWVtYmVyc2hpcFJlcXVlc3QaMS5zY3JpYmUuY2xpZW50cy5yZWFsdGltZS52MS5Ub3BpY01l'
    'bWJlcnNoaXBSZXN1bHQ=');
