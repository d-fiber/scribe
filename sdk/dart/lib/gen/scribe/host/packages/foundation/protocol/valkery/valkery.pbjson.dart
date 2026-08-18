// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/foundation/protocol/valkery/valkery.proto.

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

@$core.Deprecated('Use valkeryKeyDescriptor instead')
const ValkeryKey$json = {
  '1': 'ValkeryKey',
  '2': [
    {'1': 'namespace', '3': 1, '4': 1, '5': 9, '10': 'namespace'},
    {'1': 'key', '3': 2, '4': 1, '5': 9, '10': 'key'},
  ],
};

/// Descriptor for `ValkeryKey`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List valkeryKeyDescriptor = $convert.base64Decode(
    'CgpWYWxrZXJ5S2V5EhwKCW5hbWVzcGFjZRgBIAEoCVIJbmFtZXNwYWNlEhAKA2tleRgCIAEoCV'
    'IDa2V5');

@$core.Deprecated('Use getRequestDescriptor instead')
const GetRequest$json = {
  '1': 'GetRequest',
  '2': [
    {
      '1': 'key',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.runtime.valkery.v1.ValkeryKey',
      '10': 'key'
    },
  ],
};

/// Descriptor for `GetRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List getRequestDescriptor = $convert.base64Decode(
    'CgpHZXRSZXF1ZXN0EjcKA2tleRgBIAEoCzIlLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudjEuVm'
    'Fsa2VyeUtleVIDa2V5');

@$core.Deprecated('Use getResultDescriptor instead')
const GetResult$json = {
  '1': 'GetResult',
  '2': [
    {'1': 'hit', '3': 1, '4': 1, '5': 8, '10': 'hit'},
    {
      '1': 'value',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'value'
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

/// Descriptor for `GetResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List getResultDescriptor = $convert.base64Decode(
    'CglHZXRSZXN1bHQSEAoDaGl0GAEgASgIUgNoaXQSJQoFdmFsdWUYAiABKAsyDy5zY3JpYmUudj'
    'EuSnNvblIFdmFsdWUSKAoFZXJyb3IYAyABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use setRequestDescriptor instead')
const SetRequest$json = {
  '1': 'SetRequest',
  '2': [
    {
      '1': 'key',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.runtime.valkery.v1.ValkeryKey',
      '10': 'key'
    },
    {
      '1': 'value',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'value'
    },
    {'1': 'ttl', '3': 3, '4': 1, '5': 11, '6': '.scribe.v1.Time', '10': 'ttl'},
  ],
};

/// Descriptor for `SetRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List setRequestDescriptor = $convert.base64Decode(
    'CgpTZXRSZXF1ZXN0EjcKA2tleRgBIAEoCzIlLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudjEuVm'
    'Fsa2VyeUtleVIDa2V5EiUKBXZhbHVlGAIgASgLMg8uc2NyaWJlLnYxLkpzb25SBXZhbHVlEiEK'
    'A3R0bBgDIAEoCzIPLnNjcmliZS52MS5UaW1lUgN0dGw=');

@$core.Deprecated('Use setResultDescriptor instead')
const SetResult$json = {
  '1': 'SetResult',
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

/// Descriptor for `SetResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List setResultDescriptor = $convert.base64Decode(
    'CglTZXRSZXN1bHQSKAoFZXJyb3IYASABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use deleteRequestDescriptor instead')
const DeleteRequest$json = {
  '1': 'DeleteRequest',
  '2': [
    {
      '1': 'key',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.runtime.valkery.v1.ValkeryKey',
      '10': 'key'
    },
    {'1': 'prefix', '3': 2, '4': 1, '5': 8, '10': 'prefix'},
  ],
};

/// Descriptor for `DeleteRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteRequestDescriptor = $convert.base64Decode(
    'Cg1EZWxldGVSZXF1ZXN0EjcKA2tleRgBIAEoCzIlLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudj'
    'EuVmFsa2VyeUtleVIDa2V5EhYKBnByZWZpeBgCIAEoCFIGcHJlZml4');

@$core.Deprecated('Use deleteResultDescriptor instead')
const DeleteResult$json = {
  '1': 'DeleteResult',
  '2': [
    {'1': 'deleted', '3': 1, '4': 1, '5': 13, '10': 'deleted'},
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

/// Descriptor for `DeleteResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteResultDescriptor = $convert.base64Decode(
    'CgxEZWxldGVSZXN1bHQSGAoHZGVsZXRlZBgBIAEoDVIHZGVsZXRlZBIoCgVlcnJvchgCIAEoCz'
    'ISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

const $core.Map<$core.String, $core.dynamic> ValkeryServiceBase$json = {
  '1': 'Valkery',
  '2': [
    {
      '1': 'Get',
      '2': '.scribe.runtime.valkery.v1.GetRequest',
      '3': '.scribe.runtime.valkery.v1.GetResult'
    },
    {
      '1': 'Set',
      '2': '.scribe.runtime.valkery.v1.SetRequest',
      '3': '.scribe.runtime.valkery.v1.SetResult'
    },
    {
      '1': 'Delete',
      '2': '.scribe.runtime.valkery.v1.DeleteRequest',
      '3': '.scribe.runtime.valkery.v1.DeleteResult'
    },
  ],
};

@$core.Deprecated('Use valkeryServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    ValkeryServiceBase$messageJson = {
  '.scribe.runtime.valkery.v1.GetRequest': GetRequest$json,
  '.scribe.runtime.valkery.v1.ValkeryKey': ValkeryKey$json,
  '.scribe.runtime.valkery.v1.GetResult': GetResult$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.runtime.valkery.v1.SetRequest': SetRequest$json,
  '.scribe.v1.Time': $0.Time$json,
  '.scribe.runtime.valkery.v1.SetResult': SetResult$json,
  '.scribe.runtime.valkery.v1.DeleteRequest': DeleteRequest$json,
  '.scribe.runtime.valkery.v1.DeleteResult': DeleteResult$json,
};

/// Descriptor for `Valkery`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List valkeryServiceDescriptor = $convert.base64Decode(
    'CgdWYWxrZXJ5ElIKA0dldBIlLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudjEuR2V0UmVxdWVzdB'
    'okLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudjEuR2V0UmVzdWx0ElIKA1NldBIlLnNjcmliZS5y'
    'dW50aW1lLnZhbGtlcnkudjEuU2V0UmVxdWVzdBokLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudj'
    'EuU2V0UmVzdWx0ElsKBkRlbGV0ZRIoLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudjEuRGVsZXRl'
    'UmVxdWVzdBonLnNjcmliZS5ydW50aW1lLnZhbGtlcnkudjEuRGVsZXRlUmVzdWx0');
