// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/foundation/protocol/hook/hook.proto.

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

@$core.Deprecated('Use eventDescriptor instead')
const Event$json = {
  '1': 'Event',
  '2': [
    {'1': 'hook_id', '3': 1, '4': 1, '5': 9, '10': 'hookId'},
    {'1': 'event', '3': 2, '4': 1, '5': 9, '10': 'event'},
    {'1': 'trace_id', '3': 3, '4': 1, '5': 9, '10': 'traceId'},
    {
      '1': 'payload',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'payload'
    },
    {'1': 'emitted_at', '3': 5, '4': 1, '5': 3, '10': 'emittedAt'},
    {'1': 'capability_token', '3': 6, '4': 1, '5': 9, '10': 'capabilityToken'},
  ],
};

/// Descriptor for `Event`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List eventDescriptor = $convert.base64Decode(
    'CgVFdmVudBIXCgdob29rX2lkGAEgASgJUgZob29rSWQSFAoFZXZlbnQYAiABKAlSBWV2ZW50Eh'
    'kKCHRyYWNlX2lkGAMgASgJUgd0cmFjZUlkEikKB3BheWxvYWQYBCABKAsyDy5zY3JpYmUudjEu'
    'SnNvblIHcGF5bG9hZBIdCgplbWl0dGVkX2F0GAUgASgDUgllbWl0dGVkQXQSKQoQY2FwYWJpbG'
    'l0eV90b2tlbhgGIAEoCVIPY2FwYWJpbGl0eVRva2Vu');

@$core.Deprecated('Use emitResultDescriptor instead')
const EmitResult$json = {
  '1': 'EmitResult',
  '2': [
    {'1': 'handled', '3': 1, '4': 1, '5': 13, '10': 'handled'},
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

/// Descriptor for `EmitResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List emitResultDescriptor = $convert.base64Decode(
    'CgpFbWl0UmVzdWx0EhgKB2hhbmRsZWQYASABKA1SB2hhbmRsZWQSKAoFZXJyb3IYAiABKAsyEi'
    '5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use handleResultDescriptor instead')
const HandleResult$json = {
  '1': 'HandleResult',
  '2': [
    {'1': 'halted', '3': 1, '4': 1, '5': 8, '10': 'halted'},
    {
      '1': 'mutation',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'mutation'
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

/// Descriptor for `HandleResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List handleResultDescriptor = $convert.base64Decode(
    'CgxIYW5kbGVSZXN1bHQSFgoGaGFsdGVkGAEgASgIUgZoYWx0ZWQSKwoIbXV0YXRpb24YAiABKA'
    'syDy5zY3JpYmUudjEuSnNvblIIbXV0YXRpb24SKAoFZXJyb3IYAyABKAsyEi5zY3JpYmUudjEu'
    'RmFpbHVyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> HookServiceBase$json = {
  '1': 'Hook',
  '2': [
    {
      '1': 'Emit',
      '2': '.scribe.runtime.hook.v1.Event',
      '3': '.scribe.runtime.hook.v1.EmitResult'
    },
  ],
};

@$core.Deprecated('Use hookServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    HookServiceBase$messageJson = {
  '.scribe.runtime.hook.v1.Event': Event$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.runtime.hook.v1.EmitResult': EmitResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `Hook`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List hookServiceDescriptor = $convert.base64Decode(
    'CgRIb29rEkkKBEVtaXQSHS5zY3JpYmUucnVudGltZS5ob29rLnYxLkV2ZW50GiIuc2NyaWJlLn'
    'J1bnRpbWUuaG9vay52MS5FbWl0UmVzdWx0');

const $core.Map<$core.String, $core.dynamic> HookDispatchServiceBase$json = {
  '1': 'HookDispatch',
  '2': [
    {
      '1': 'Handle',
      '2': '.scribe.runtime.hook.v1.Event',
      '3': '.scribe.runtime.hook.v1.HandleResult'
    },
  ],
};

@$core.Deprecated('Use hookDispatchServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    HookDispatchServiceBase$messageJson = {
  '.scribe.runtime.hook.v1.Event': Event$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.runtime.hook.v1.HandleResult': HandleResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `HookDispatch`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List hookDispatchServiceDescriptor = $convert.base64Decode(
    'CgxIb29rRGlzcGF0Y2gSTQoGSGFuZGxlEh0uc2NyaWJlLnJ1bnRpbWUuaG9vay52MS5FdmVudB'
    'okLnNjcmliZS5ydW50aW1lLmhvb2sudjEuSGFuZGxlUmVzdWx0');
