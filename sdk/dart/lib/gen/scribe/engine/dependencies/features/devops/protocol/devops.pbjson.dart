// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/features/devops/protocol/devops.proto.

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

@$core.Deprecated('Use remoteConfigRequestDescriptor instead')
const RemoteConfigRequest$json = {
  '1': 'RemoteConfigRequest',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'platform', '3': 2, '4': 1, '5': 9, '10': 'platform'},
    {'1': 'app_version', '3': 3, '4': 1, '5': 9, '10': 'appVersion'},
  ],
};

/// Descriptor for `RemoteConfigRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List remoteConfigRequestDescriptor = $convert.base64Decode(
    'ChNSZW1vdGVDb25maWdSZXF1ZXN0EhAKA2tleRgBIAEoCVIDa2V5EhoKCHBsYXRmb3JtGAIgAS'
    'gJUghwbGF0Zm9ybRIfCgthcHBfdmVyc2lvbhgDIAEoCVIKYXBwVmVyc2lvbg==');

@$core.Deprecated('Use remoteConfigResultDescriptor instead')
const RemoteConfigResult$json = {
  '1': 'RemoteConfigResult',
  '2': [
    {
      '1': 'value',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'value'
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

/// Descriptor for `RemoteConfigResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List remoteConfigResultDescriptor = $convert.base64Decode(
    'ChJSZW1vdGVDb25maWdSZXN1bHQSJQoFdmFsdWUYASABKAsyDy5zY3JpYmUudjEuSnNvblIFdm'
    'FsdWUSKAoFZXJyb3IYAiABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> RemoteConfigsServiceBase$json = {
  '1': 'RemoteConfigs',
  '2': [
    {
      '1': 'Get',
      '2': '.scribe.clients.devops.v1.RemoteConfigRequest',
      '3': '.scribe.clients.devops.v1.RemoteConfigResult'
    },
  ],
};

@$core.Deprecated('Use remoteConfigsServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RemoteConfigsServiceBase$messageJson = {
  '.scribe.clients.devops.v1.RemoteConfigRequest': RemoteConfigRequest$json,
  '.scribe.clients.devops.v1.RemoteConfigResult': RemoteConfigResult$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `RemoteConfigs`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List remoteConfigsServiceDescriptor = $convert.base64Decode(
    'Cg1SZW1vdGVDb25maWdzEmIKA0dldBItLnNjcmliZS5jbGllbnRzLmRldm9wcy52MS5SZW1vdG'
    'VDb25maWdSZXF1ZXN0Giwuc2NyaWJlLmNsaWVudHMuZGV2b3BzLnYxLlJlbW90ZUNvbmZpZ1Jl'
    'c3VsdA==');
