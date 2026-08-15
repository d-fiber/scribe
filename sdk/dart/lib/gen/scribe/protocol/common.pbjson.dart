// This is a generated file - do not edit.
//
// Generated from scribe/protocol/common.proto.

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

@$core.Deprecated('Use callerDescriptor instead')
const Caller$json = {
  '1': 'Caller',
  '2': [
    {'1': 'CALLER_UNSPECIFIED', '2': 0},
    {'1': 'CALLER_ANONYMOUS', '2': 1},
    {'1': 'CALLER_USER', '2': 2},
    {'1': 'CALLER_ADMIN', '2': 3},
    {'1': 'CALLER_SERVICE', '2': 4},
    {'1': 'CALLER_WEBHOOK', '2': 5},
  ],
};

/// Descriptor for `Caller`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List callerDescriptor = $convert.base64Decode(
    'CgZDYWxsZXISFgoSQ0FMTEVSX1VOU1BFQ0lGSUVEEAASFAoQQ0FMTEVSX0FOT05ZTU9VUxABEg'
    '8KC0NBTExFUl9VU0VSEAISEAoMQ0FMTEVSX0FETUlOEAMSEgoOQ0FMTEVSX1NFUlZJQ0UQBBIS'
    'Cg5DQUxMRVJfV0VCSE9PSxAF');

@$core.Deprecated('Use methodDescriptor instead')
const Method$json = {
  '1': 'Method',
  '2': [
    {'1': 'METHOD_UNSPECIFIED', '2': 0},
    {'1': 'METHOD_GET', '2': 1},
    {'1': 'METHOD_POST', '2': 2},
    {'1': 'METHOD_PUT', '2': 3},
    {'1': 'METHOD_PATCH', '2': 4},
    {'1': 'METHOD_DELETE', '2': 5},
  ],
};

/// Descriptor for `Method`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List methodDescriptor = $convert.base64Decode(
    'CgZNZXRob2QSFgoSTUVUSE9EX1VOU1BFQ0lGSUVEEAASDgoKTUVUSE9EX0dFVBABEg8KC01FVE'
    'hPRF9QT1NUEAISDgoKTUVUSE9EX1BVVBADEhAKDE1FVEhPRF9QQVRDSBAEEhEKDU1FVEhPRF9E'
    'RUxFVEUQBQ==');

@$core.Deprecated('Use needDescriptor instead')
const Need$json = {
  '1': 'Need',
  '2': [
    {'1': 'NEED_UNSPECIFIED', '2': 0},
    {'1': 'NEED_DEVICE', '2': 1},
    {'1': 'NEED_LOCATION', '2': 2},
  ],
};

/// Descriptor for `Need`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List needDescriptor = $convert.base64Decode(
    'CgROZWVkEhQKEE5FRURfVU5TUEVDSUZJRUQQABIPCgtORUVEX0RFVklDRRABEhEKDU5FRURfTE'
    '9DQVRJT04QAg==');

@$core.Deprecated('Use timeDescriptor instead')
const Time$json = {
  '1': 'Time',
  '2': [
    {'1': 'millis', '3': 1, '4': 1, '5': 3, '10': 'millis'},
  ],
};

/// Descriptor for `Time`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List timeDescriptor =
    $convert.base64Decode('CgRUaW1lEhYKBm1pbGxpcxgBIAEoA1IGbWlsbGlz');

@$core.Deprecated('Use sizeDescriptor instead')
const Size$json = {
  '1': 'Size',
  '2': [
    {'1': 'bytes', '3': 1, '4': 1, '5': 3, '10': 'bytes'},
  ],
};

/// Descriptor for `Size`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List sizeDescriptor =
    $convert.base64Decode('CgRTaXplEhQKBWJ5dGVzGAEgASgDUgVieXRlcw==');

@$core.Deprecated('Use failureDescriptor instead')
const Failure$json = {
  '1': 'Failure',
  '2': [
    {'1': 'code', '3': 1, '4': 1, '5': 9, '10': 'code'},
    {'1': 'message', '3': 2, '4': 1, '5': 9, '10': 'message'},
  ],
};

/// Descriptor for `Failure`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List failureDescriptor = $convert.base64Decode(
    'CgdGYWlsdXJlEhIKBGNvZGUYASABKAlSBGNvZGUSGAoHbWVzc2FnZRgCIAEoCVIHbWVzc2FnZQ'
    '==');

@$core.Deprecated('Use jsonDescriptor instead')
const Json$json = {
  '1': 'Json',
  '2': [
    {'1': 'value', '3': 1, '4': 1, '5': 12, '10': 'value'},
  ],
};

/// Descriptor for `Json`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List jsonDescriptor =
    $convert.base64Decode('CgRKc29uEhQKBXZhbHVlGAEgASgMUgV2YWx1ZQ==');
