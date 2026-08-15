// This is a generated file - do not edit.
//
// Generated from scribe/protocol/logs.proto.

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

import 'common.pbjson.dart' as $0;

@$core.Deprecated('Use logLevelDescriptor instead')
const LogLevel$json = {
  '1': 'LogLevel',
  '2': [
    {'1': 'LOG_LEVEL_UNSPECIFIED', '2': 0},
    {'1': 'LOG_LEVEL_DEBUG', '2': 1},
    {'1': 'LOG_LEVEL_INFO', '2': 2},
    {'1': 'LOG_LEVEL_WARN', '2': 3},
    {'1': 'LOG_LEVEL_ERROR', '2': 4},
  ],
};

/// Descriptor for `LogLevel`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List logLevelDescriptor = $convert.base64Decode(
    'CghMb2dMZXZlbBIZChVMT0dfTEVWRUxfVU5TUEVDSUZJRUQQABITCg9MT0dfTEVWRUxfREVCVU'
    'cQARISCg5MT0dfTEVWRUxfSU5GTxACEhIKDkxPR19MRVZFTF9XQVJOEAMSEwoPTE9HX0xFVkVM'
    'X0VSUk9SEAQ=');

@$core.Deprecated('Use logEntryDescriptor instead')
const LogEntry$json = {
  '1': 'LogEntry',
  '2': [
    {
      '1': 'level',
      '3': 1,
      '4': 1,
      '5': 14,
      '6': '.scribe.v1.LogLevel',
      '10': 'level'
    },
    {'1': 'action', '3': 2, '4': 1, '5': 9, '10': 'action'},
    {'1': 'actor_type', '3': 3, '4': 1, '5': 9, '10': 'actorType'},
    {'1': 'actor_id', '3': 4, '4': 1, '5': 9, '10': 'actorId'},
    {
      '1': 'metadata',
      '3': 5,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'metadata'
    },
    {'1': 'timestamp', '3': 6, '4': 1, '5': 3, '10': 'timestamp'},
    {'1': 'trace_id', '3': 7, '4': 1, '5': 9, '10': 'traceId'},
    {'1': 'invocation_id', '3': 8, '4': 1, '5': 9, '10': 'invocationId'},
  ],
};

/// Descriptor for `LogEntry`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List logEntryDescriptor = $convert.base64Decode(
    'CghMb2dFbnRyeRIpCgVsZXZlbBgBIAEoDjITLnNjcmliZS52MS5Mb2dMZXZlbFIFbGV2ZWwSFg'
    'oGYWN0aW9uGAIgASgJUgZhY3Rpb24SHQoKYWN0b3JfdHlwZRgDIAEoCVIJYWN0b3JUeXBlEhkK'
    'CGFjdG9yX2lkGAQgASgJUgdhY3RvcklkEisKCG1ldGFkYXRhGAUgASgLMg8uc2NyaWJlLnYxLk'
    'pzb25SCG1ldGFkYXRhEhwKCXRpbWVzdGFtcBgGIAEoA1IJdGltZXN0YW1wEhkKCHRyYWNlX2lk'
    'GAcgASgJUgd0cmFjZUlkEiMKDWludm9jYXRpb25faWQYCCABKAlSDGludm9jYXRpb25JZA==');

@$core.Deprecated('Use logBatchDescriptor instead')
const LogBatch$json = {
  '1': 'LogBatch',
  '2': [
    {
      '1': 'entries',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.LogEntry',
      '10': 'entries'
    },
  ],
};

/// Descriptor for `LogBatch`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List logBatchDescriptor = $convert.base64Decode(
    'CghMb2dCYXRjaBItCgdlbnRyaWVzGAEgAygLMhMuc2NyaWJlLnYxLkxvZ0VudHJ5UgdlbnRyaW'
    'Vz');

@$core.Deprecated('Use logAckDescriptor instead')
const LogAck$json = {
  '1': 'LogAck',
};

/// Descriptor for `LogAck`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List logAckDescriptor =
    $convert.base64Decode('CgZMb2dBY2s=');

const $core.Map<$core.String, $core.dynamic> LoggingServiceBase$json = {
  '1': 'Logging',
  '2': [
    {'1': 'Ship', '2': '.scribe.v1.LogBatch', '3': '.scribe.v1.LogAck'},
  ],
};

@$core.Deprecated('Use loggingServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    LoggingServiceBase$messageJson = {
  '.scribe.v1.LogBatch': LogBatch$json,
  '.scribe.v1.LogEntry': LogEntry$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.LogAck': LogAck$json,
};

/// Descriptor for `Logging`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List loggingServiceDescriptor = $convert.base64Decode(
    'CgdMb2dnaW5nEi4KBFNoaXASEy5zY3JpYmUudjEuTG9nQmF0Y2gaES5zY3JpYmUudjEuTG9nQW'
    'Nr');
