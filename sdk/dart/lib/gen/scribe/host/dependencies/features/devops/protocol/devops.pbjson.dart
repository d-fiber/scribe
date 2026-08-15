// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/devops/protocol/devops.proto.

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

@$core.Deprecated('Use dynamicLinkDescriptor instead')
const DynamicLink$json = {
  '1': 'DynamicLink',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'slug', '3': 2, '4': 1, '5': 9, '10': 'slug'},
    {'1': 'target_url', '3': 3, '4': 1, '5': 9, '10': 'targetUrl'},
    {
      '1': 'metadata',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'metadata'
    },
    {'1': 'expires_at', '3': 5, '4': 1, '5': 3, '10': 'expiresAt'},
  ],
};

/// Descriptor for `DynamicLink`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List dynamicLinkDescriptor = $convert.base64Decode(
    'CgtEeW5hbWljTGluaxIOCgJpZBgBIAEoCVICaWQSEgoEc2x1ZxgCIAEoCVIEc2x1ZxIdCgp0YX'
    'JnZXRfdXJsGAMgASgJUgl0YXJnZXRVcmwSKwoIbWV0YWRhdGEYBCABKAsyDy5zY3JpYmUudjEu'
    'SnNvblIIbWV0YWRhdGESHQoKZXhwaXJlc19hdBgFIAEoA1IJZXhwaXJlc0F0');

@$core.Deprecated('Use addLinkRequestDescriptor instead')
const AddLinkRequest$json = {
  '1': 'AddLinkRequest',
  '2': [
    {
      '1': 'link',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.devops.v1.DynamicLink',
      '10': 'link'
    },
  ],
};

/// Descriptor for `AddLinkRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List addLinkRequestDescriptor = $convert.base64Decode(
    'Cg5BZGRMaW5rUmVxdWVzdBI5CgRsaW5rGAEgASgLMiUuc2NyaWJlLmNsaWVudHMuZGV2b3BzLn'
    'YxLkR5bmFtaWNMaW5rUgRsaW5r');

@$core.Deprecated('Use updateLinkRequestDescriptor instead')
const UpdateLinkRequest$json = {
  '1': 'UpdateLinkRequest',
  '2': [
    {
      '1': 'link',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.devops.v1.DynamicLink',
      '10': 'link'
    },
  ],
};

/// Descriptor for `UpdateLinkRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List updateLinkRequestDescriptor = $convert.base64Decode(
    'ChFVcGRhdGVMaW5rUmVxdWVzdBI5CgRsaW5rGAEgASgLMiUuc2NyaWJlLmNsaWVudHMuZGV2b3'
    'BzLnYxLkR5bmFtaWNMaW5rUgRsaW5r');

@$core.Deprecated('Use removeLinkRequestDescriptor instead')
const RemoveLinkRequest$json = {
  '1': 'RemoveLinkRequest',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'slug', '3': 2, '4': 1, '5': 9, '10': 'slug'},
  ],
};

/// Descriptor for `RemoveLinkRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List removeLinkRequestDescriptor = $convert.base64Decode(
    'ChFSZW1vdmVMaW5rUmVxdWVzdBIOCgJpZBgBIAEoCVICaWQSEgoEc2x1ZxgCIAEoCVIEc2x1Zw'
    '==');

@$core.Deprecated('Use linkResultDescriptor instead')
const LinkResult$json = {
  '1': 'LinkResult',
  '2': [
    {
      '1': 'link',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.devops.v1.DynamicLink',
      '10': 'link'
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

/// Descriptor for `LinkResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List linkResultDescriptor = $convert.base64Decode(
    'CgpMaW5rUmVzdWx0EjkKBGxpbmsYASABKAsyJS5zY3JpYmUuY2xpZW50cy5kZXZvcHMudjEuRH'
    'luYW1pY0xpbmtSBGxpbmsSKAoFZXJyb3IYAiABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJy'
    'b3I=');

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

const $core.Map<$core.String, $core.dynamic> DynamicLinksServiceBase$json = {
  '1': 'DynamicLinks',
  '2': [
    {
      '1': 'Add',
      '2': '.scribe.clients.devops.v1.AddLinkRequest',
      '3': '.scribe.clients.devops.v1.LinkResult'
    },
    {
      '1': 'Update',
      '2': '.scribe.clients.devops.v1.UpdateLinkRequest',
      '3': '.scribe.clients.devops.v1.LinkResult'
    },
    {
      '1': 'Remove',
      '2': '.scribe.clients.devops.v1.RemoveLinkRequest',
      '3': '.scribe.clients.devops.v1.LinkResult'
    },
  ],
};

@$core.Deprecated('Use dynamicLinksServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    DynamicLinksServiceBase$messageJson = {
  '.scribe.clients.devops.v1.AddLinkRequest': AddLinkRequest$json,
  '.scribe.clients.devops.v1.DynamicLink': DynamicLink$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.devops.v1.LinkResult': LinkResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.devops.v1.UpdateLinkRequest': UpdateLinkRequest$json,
  '.scribe.clients.devops.v1.RemoveLinkRequest': RemoveLinkRequest$json,
};

/// Descriptor for `DynamicLinks`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List dynamicLinksServiceDescriptor = $convert.base64Decode(
    'CgxEeW5hbWljTGlua3MSVQoDQWRkEiguc2NyaWJlLmNsaWVudHMuZGV2b3BzLnYxLkFkZExpbm'
    'tSZXF1ZXN0GiQuc2NyaWJlLmNsaWVudHMuZGV2b3BzLnYxLkxpbmtSZXN1bHQSWwoGVXBkYXRl'
    'Eisuc2NyaWJlLmNsaWVudHMuZGV2b3BzLnYxLlVwZGF0ZUxpbmtSZXF1ZXN0GiQuc2NyaWJlLm'
    'NsaWVudHMuZGV2b3BzLnYxLkxpbmtSZXN1bHQSWwoGUmVtb3ZlEisuc2NyaWJlLmNsaWVudHMu'
    'ZGV2b3BzLnYxLlJlbW92ZUxpbmtSZXF1ZXN0GiQuc2NyaWJlLmNsaWVudHMuZGV2b3BzLnYxLk'
    'xpbmtSZXN1bHQ=');

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
