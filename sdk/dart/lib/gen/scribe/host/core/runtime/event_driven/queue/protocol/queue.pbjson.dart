// This is a generated file - do not edit.
//
// Generated from scribe/host/core/runtime/event_driven/queue/protocol/queue.proto.

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

import '../../../../../../protocol/common.pbjson.dart' as $0;

@$core.Deprecated('Use messageDescriptor instead')
const Message$json = {
  '1': 'Message',
  '2': [
    {'1': 'message_id', '3': 1, '4': 1, '5': 9, '10': 'messageId'},
    {
      '1': 'payload',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'payload'
    },
    {'1': 'attempt', '3': 3, '4': 1, '5': 13, '10': 'attempt'},
    {'1': 'enqueued_at', '3': 4, '4': 1, '5': 3, '10': 'enqueuedAt'},
  ],
};

/// Descriptor for `Message`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List messageDescriptor = $convert.base64Decode(
    'CgdNZXNzYWdlEh0KCm1lc3NhZ2VfaWQYASABKAlSCW1lc3NhZ2VJZBIpCgdwYXlsb2FkGAIgAS'
    'gLMg8uc2NyaWJlLnYxLkpzb25SB3BheWxvYWQSGAoHYXR0ZW1wdBgDIAEoDVIHYXR0ZW1wdBIf'
    'CgtlbnF1ZXVlZF9hdBgEIAEoA1IKZW5xdWV1ZWRBdA==');

@$core.Deprecated('Use pushRequestDescriptor instead')
const PushRequest$json = {
  '1': 'PushRequest',
  '2': [
    {'1': 'queue_id', '3': 1, '4': 1, '5': 9, '10': 'queueId'},
    {
      '1': 'payloads',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'payloads'
    },
    {
      '1': 'delay',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Time',
      '10': 'delay'
    },
  ],
};

/// Descriptor for `PushRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List pushRequestDescriptor = $convert.base64Decode(
    'CgtQdXNoUmVxdWVzdBIZCghxdWV1ZV9pZBgBIAEoCVIHcXVldWVJZBIrCghwYXlsb2FkcxgCIA'
    'MoCzIPLnNjcmliZS52MS5Kc29uUghwYXlsb2FkcxIlCgVkZWxheRgDIAEoCzIPLnNjcmliZS52'
    'MS5UaW1lUgVkZWxheQ==');

@$core.Deprecated('Use pushResultDescriptor instead')
const PushResult$json = {
  '1': 'PushResult',
  '2': [
    {'1': 'message_ids', '3': 1, '4': 3, '5': 9, '10': 'messageIds'},
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

/// Descriptor for `PushResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List pushResultDescriptor = $convert.base64Decode(
    'CgpQdXNoUmVzdWx0Eh8KC21lc3NhZ2VfaWRzGAEgAygJUgptZXNzYWdlSWRzEigKBWVycm9yGA'
    'IgASgLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVycm9y');

@$core.Deprecated('Use batchDescriptor instead')
const Batch$json = {
  '1': 'Batch',
  '2': [
    {'1': 'queue_id', '3': 1, '4': 1, '5': 9, '10': 'queueId'},
    {'1': 'trace_id', '3': 2, '4': 1, '5': 9, '10': 'traceId'},
    {
      '1': 'messages',
      '3': 3,
      '4': 3,
      '5': 11,
      '6': '.scribe.runtime.queue.v1.Message',
      '10': 'messages'
    },
    {'1': 'capability_token', '3': 4, '4': 1, '5': 9, '10': 'capabilityToken'},
  ],
};

/// Descriptor for `Batch`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List batchDescriptor = $convert.base64Decode(
    'CgVCYXRjaBIZCghxdWV1ZV9pZBgBIAEoCVIHcXVldWVJZBIZCgh0cmFjZV9pZBgCIAEoCVIHdH'
    'JhY2VJZBI8CghtZXNzYWdlcxgDIAMoCzIgLnNjcmliZS5ydW50aW1lLnF1ZXVlLnYxLk1lc3Nh'
    'Z2VSCG1lc3NhZ2VzEikKEGNhcGFiaWxpdHlfdG9rZW4YBCABKAlSD2NhcGFiaWxpdHlUb2tlbg'
    '==');

@$core.Deprecated('Use messageOutcomeDescriptor instead')
const MessageOutcome$json = {
  '1': 'MessageOutcome',
  '2': [
    {'1': 'message_id', '3': 1, '4': 1, '5': 9, '10': 'messageId'},
    {'1': 'acknowledged', '3': 2, '4': 1, '5': 8, '10': 'acknowledged'},
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

/// Descriptor for `MessageOutcome`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List messageOutcomeDescriptor = $convert.base64Decode(
    'Cg5NZXNzYWdlT3V0Y29tZRIdCgptZXNzYWdlX2lkGAEgASgJUgltZXNzYWdlSWQSIgoMYWNrbm'
    '93bGVkZ2VkGAIgASgIUgxhY2tub3dsZWRnZWQSKAoFZXJyb3IYAyABKAsyEi5zY3JpYmUudjEu'
    'RmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use batchOutcomeDescriptor instead')
const BatchOutcome$json = {
  '1': 'BatchOutcome',
  '2': [
    {
      '1': 'outcomes',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.runtime.queue.v1.MessageOutcome',
      '10': 'outcomes'
    },
  ],
};

/// Descriptor for `BatchOutcome`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List batchOutcomeDescriptor = $convert.base64Decode(
    'CgxCYXRjaE91dGNvbWUSQwoIb3V0Y29tZXMYASADKAsyJy5zY3JpYmUucnVudGltZS5xdWV1ZS'
    '52MS5NZXNzYWdlT3V0Y29tZVIIb3V0Y29tZXM=');

const $core.Map<$core.String, $core.dynamic> QueueServiceBase$json = {
  '1': 'Queue',
  '2': [
    {
      '1': 'Push',
      '2': '.scribe.runtime.queue.v1.PushRequest',
      '3': '.scribe.runtime.queue.v1.PushResult'
    },
  ],
};

@$core.Deprecated('Use queueServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    QueueServiceBase$messageJson = {
  '.scribe.runtime.queue.v1.PushRequest': PushRequest$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.Time': $0.Time$json,
  '.scribe.runtime.queue.v1.PushResult': PushResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `Queue`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List queueServiceDescriptor = $convert.base64Decode(
    'CgVRdWV1ZRJRCgRQdXNoEiQuc2NyaWJlLnJ1bnRpbWUucXVldWUudjEuUHVzaFJlcXVlc3QaIy'
    '5zY3JpYmUucnVudGltZS5xdWV1ZS52MS5QdXNoUmVzdWx0');

const $core.Map<$core.String, $core.dynamic> QueueDispatchServiceBase$json = {
  '1': 'QueueDispatch',
  '2': [
    {
      '1': 'Handle',
      '2': '.scribe.runtime.queue.v1.Batch',
      '3': '.scribe.runtime.queue.v1.BatchOutcome'
    },
  ],
};

@$core.Deprecated('Use queueDispatchServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    QueueDispatchServiceBase$messageJson = {
  '.scribe.runtime.queue.v1.Batch': Batch$json,
  '.scribe.runtime.queue.v1.Message': Message$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.runtime.queue.v1.BatchOutcome': BatchOutcome$json,
  '.scribe.runtime.queue.v1.MessageOutcome': MessageOutcome$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `QueueDispatch`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List queueDispatchServiceDescriptor = $convert.base64Decode(
    'Cg1RdWV1ZURpc3BhdGNoEk8KBkhhbmRsZRIeLnNjcmliZS5ydW50aW1lLnF1ZXVlLnYxLkJhdG'
    'NoGiUuc2NyaWJlLnJ1bnRpbWUucXVldWUudjEuQmF0Y2hPdXRjb21l');
