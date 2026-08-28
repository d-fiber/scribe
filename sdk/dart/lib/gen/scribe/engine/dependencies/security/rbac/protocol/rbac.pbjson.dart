// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/security/rbac/protocol/rbac.proto.

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

import '../../../../../protocol/common.pbjson.dart' as $1;
import '../../../../../protocol/invocation.pbjson.dart' as $0;

@$core.Deprecated('Use rulesRequestDescriptor instead')
const RulesRequest$json = {
  '1': 'RulesRequest',
  '2': [
    {'1': 'admin_id', '3': 1, '4': 1, '5': 9, '10': 'adminId'},
  ],
};

/// Descriptor for `RulesRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List rulesRequestDescriptor = $convert
    .base64Decode('CgxSdWxlc1JlcXVlc3QSGQoIYWRtaW5faWQYASABKAlSB2FkbWluSWQ=');

@$core.Deprecated('Use rulesResultDescriptor instead')
const RulesResult$json = {
  '1': 'RulesResult',
  '2': [
    {
      '1': 'rules',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Rules',
      '10': 'rules'
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

/// Descriptor for `RulesResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List rulesResultDescriptor = $convert.base64Decode(
    'CgtSdWxlc1Jlc3VsdBImCgVydWxlcxgBIAEoCzIQLnNjcmliZS52MS5SdWxlc1IFcnVsZXMSKA'
    'oFZXJyb3IYAiABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use permissionRequestDescriptor instead')
const PermissionRequest$json = {
  '1': 'PermissionRequest',
  '2': [
    {'1': 'admin_id', '3': 1, '4': 1, '5': 9, '10': 'adminId'},
    {'1': 'permissions', '3': 2, '4': 3, '5': 9, '10': 'permissions'},
    {'1': 'require_all', '3': 3, '4': 1, '5': 8, '10': 'requireAll'},
  ],
};

/// Descriptor for `PermissionRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List permissionRequestDescriptor = $convert.base64Decode(
    'ChFQZXJtaXNzaW9uUmVxdWVzdBIZCghhZG1pbl9pZBgBIAEoCVIHYWRtaW5JZBIgCgtwZXJtaX'
    'NzaW9ucxgCIAMoCVILcGVybWlzc2lvbnMSHwoLcmVxdWlyZV9hbGwYAyABKAhSCnJlcXVpcmVB'
    'bGw=');

@$core.Deprecated('Use permissionResultDescriptor instead')
const PermissionResult$json = {
  '1': 'PermissionResult',
  '2': [
    {'1': 'granted', '3': 1, '4': 1, '5': 8, '10': 'granted'},
    {'1': 'missing', '3': 2, '4': 3, '5': 9, '10': 'missing'},
  ],
};

/// Descriptor for `PermissionResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List permissionResultDescriptor = $convert.base64Decode(
    'ChBQZXJtaXNzaW9uUmVzdWx0EhgKB2dyYW50ZWQYASABKAhSB2dyYW50ZWQSGAoHbWlzc2luZx'
    'gCIAMoCVIHbWlzc2luZw==');

const $core.Map<$core.String, $core.dynamic> RbacServiceBase$json = {
  '1': 'Rbac',
  '2': [
    {
      '1': 'GetRules',
      '2': '.scribe.clients.rbac.v1.RulesRequest',
      '3': '.scribe.clients.rbac.v1.RulesResult'
    },
    {
      '1': 'HasPermission',
      '2': '.scribe.clients.rbac.v1.PermissionRequest',
      '3': '.scribe.clients.rbac.v1.PermissionResult'
    },
  ],
};

@$core.Deprecated('Use rbacServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RbacServiceBase$messageJson = {
  '.scribe.clients.rbac.v1.RulesRequest': RulesRequest$json,
  '.scribe.clients.rbac.v1.RulesResult': RulesResult$json,
  '.scribe.v1.Rules': $0.Rules$json,
  '.scribe.v1.Failure': $1.Failure$json,
  '.scribe.clients.rbac.v1.PermissionRequest': PermissionRequest$json,
  '.scribe.clients.rbac.v1.PermissionResult': PermissionResult$json,
};

/// Descriptor for `Rbac`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List rbacServiceDescriptor = $convert.base64Decode(
    'CgRSYmFjElUKCEdldFJ1bGVzEiQuc2NyaWJlLmNsaWVudHMucmJhYy52MS5SdWxlc1JlcXVlc3'
    'QaIy5zY3JpYmUuY2xpZW50cy5yYmFjLnYxLlJ1bGVzUmVzdWx0EmQKDUhhc1Blcm1pc3Npb24S'
    'KS5zY3JpYmUuY2xpZW50cy5yYmFjLnYxLlBlcm1pc3Npb25SZXF1ZXN0Giguc2NyaWJlLmNsaW'
    'VudHMucmJhYy52MS5QZXJtaXNzaW9uUmVzdWx0');
