// This is a generated file - do not edit.
//
// Generated from scribe/engine/packages/auth/protocol/auth.proto.

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

@$core.Deprecated('Use accountRequestDescriptor instead')
const AccountRequest$json = {
  '1': 'AccountRequest',
  '2': [
    {'1': 'account_id', '3': 1, '4': 1, '5': 9, '10': 'accountId'},
    {'1': 'role', '3': 2, '4': 1, '5': 9, '10': 'role'},
  ],
};

/// Descriptor for `AccountRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List accountRequestDescriptor = $convert.base64Decode(
    'Cg5BY2NvdW50UmVxdWVzdBIdCgphY2NvdW50X2lkGAEgASgJUglhY2NvdW50SWQSEgoEcm9sZR'
    'gCIAEoCVIEcm9sZQ==');

@$core.Deprecated('Use accountDescriptor instead')
const Account$json = {
  '1': 'Account',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'role', '3': 2, '4': 1, '5': 9, '10': 'role'},
    {'1': 'email', '3': 3, '4': 1, '5': 9, '10': 'email'},
    {'1': 'phone', '3': 4, '4': 1, '5': 9, '10': 'phone'},
    {'1': 'email_verified', '3': 5, '4': 1, '5': 8, '10': 'emailVerified'},
    {'1': 'phone_verified', '3': 6, '4': 1, '5': 8, '10': 'phoneVerified'},
    {'1': 'created_at', '3': 7, '4': 1, '5': 3, '10': 'createdAt'},
    {
      '1': 'ban',
      '3': 8,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.auth.v1.Ban',
      '10': 'ban'
    },
    {
      '1': 'folded',
      '3': 9,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'folded'
    },
  ],
};

/// Descriptor for `Account`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List accountDescriptor = $convert.base64Decode(
    'CgdBY2NvdW50Eg4KAmlkGAEgASgJUgJpZBISCgRyb2xlGAIgASgJUgRyb2xlEhQKBWVtYWlsGA'
    'MgASgJUgVlbWFpbBIUCgVwaG9uZRgEIAEoCVIFcGhvbmUSJQoOZW1haWxfdmVyaWZpZWQYBSAB'
    'KAhSDWVtYWlsVmVyaWZpZWQSJQoOcGhvbmVfdmVyaWZpZWQYBiABKAhSDXBob25lVmVyaWZpZW'
    'QSHQoKY3JlYXRlZF9hdBgHIAEoA1IJY3JlYXRlZEF0Ei0KA2JhbhgIIAEoCzIbLnNjcmliZS5j'
    'bGllbnRzLmF1dGgudjEuQmFuUgNiYW4SJwoGZm9sZGVkGAkgASgLMg8uc2NyaWJlLnYxLkpzb2'
    '5SBmZvbGRlZA==');

@$core.Deprecated('Use accountResultDescriptor instead')
const AccountResult$json = {
  '1': 'AccountResult',
  '2': [
    {
      '1': 'account',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.auth.v1.Account',
      '10': 'account'
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

/// Descriptor for `AccountResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List accountResultDescriptor = $convert.base64Decode(
    'Cg1BY2NvdW50UmVzdWx0EjkKB2FjY291bnQYASABKAsyHy5zY3JpYmUuY2xpZW50cy5hdXRoLn'
    'YxLkFjY291bnRSB2FjY291bnQSKAoFZXJyb3IYAiABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIF'
    'ZXJyb3I=');

@$core.Deprecated('Use banDescriptor instead')
const Ban$json = {
  '1': 'Ban',
  '2': [
    {'1': 'since', '3': 1, '4': 1, '5': 3, '10': 'since'},
    {'1': 'until', '3': 2, '4': 1, '5': 3, '10': 'until'},
    {'1': 'reason', '3': 3, '4': 1, '5': 9, '10': 'reason'},
  ],
};

/// Descriptor for `Ban`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List banDescriptor = $convert.base64Decode(
    'CgNCYW4SFAoFc2luY2UYASABKANSBXNpbmNlEhQKBXVudGlsGAIgASgDUgV1bnRpbBIWCgZyZW'
    'Fzb24YAyABKAlSBnJlYXNvbg==');

@$core.Deprecated('Use banRequestDescriptor instead')
const BanRequest$json = {
  '1': 'BanRequest',
  '2': [
    {'1': 'account_id', '3': 1, '4': 1, '5': 9, '10': 'accountId'},
    {'1': 'role', '3': 2, '4': 1, '5': 9, '10': 'role'},
    {'1': 'for_ms', '3': 3, '4': 1, '5': 3, '10': 'forMs'},
    {'1': 'reason', '3': 4, '4': 1, '5': 9, '10': 'reason'},
  ],
};

/// Descriptor for `BanRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List banRequestDescriptor = $convert.base64Decode(
    'CgpCYW5SZXF1ZXN0Eh0KCmFjY291bnRfaWQYASABKAlSCWFjY291bnRJZBISCgRyb2xlGAIgAS'
    'gJUgRyb2xlEhUKBmZvcl9tcxgDIAEoA1IFZm9yTXMSFgoGcmVhc29uGAQgASgJUgZyZWFzb24=');

@$core.Deprecated('Use banResultDescriptor instead')
const BanResult$json = {
  '1': 'BanResult',
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

/// Descriptor for `BanResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List banResultDescriptor = $convert.base64Decode(
    'CglCYW5SZXN1bHQSKAoFZXJyb3IYASABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use banListRequestDescriptor instead')
const BanListRequest$json = {
  '1': 'BanListRequest',
  '2': [
    {'1': 'role', '3': 1, '4': 1, '5': 9, '10': 'role'},
  ],
};

/// Descriptor for `BanListRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List banListRequestDescriptor =
    $convert.base64Decode('Cg5CYW5MaXN0UmVxdWVzdBISCgRyb2xlGAEgASgJUgRyb2xl');

@$core.Deprecated('Use listedBanDescriptor instead')
const ListedBan$json = {
  '1': 'ListedBan',
  '2': [
    {'1': 'account_id', '3': 1, '4': 1, '5': 9, '10': 'accountId'},
    {
      '1': 'ban',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.auth.v1.Ban',
      '10': 'ban'
    },
  ],
};

/// Descriptor for `ListedBan`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List listedBanDescriptor = $convert.base64Decode(
    'CglMaXN0ZWRCYW4SHQoKYWNjb3VudF9pZBgBIAEoCVIJYWNjb3VudElkEi0KA2JhbhgCIAEoCz'
    'IbLnNjcmliZS5jbGllbnRzLmF1dGgudjEuQmFuUgNiYW4=');

@$core.Deprecated('Use banListResultDescriptor instead')
const BanListResult$json = {
  '1': 'BanListResult',
  '2': [
    {
      '1': 'bans',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.auth.v1.ListedBan',
      '10': 'bans'
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

/// Descriptor for `BanListResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List banListResultDescriptor = $convert.base64Decode(
    'Cg1CYW5MaXN0UmVzdWx0EjUKBGJhbnMYASADKAsyIS5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLk'
    'xpc3RlZEJhblIEYmFucxIoCgVlcnJvchgCIAEoCzISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJv'
    'cg==');

@$core.Deprecated('Use deviceRequestDescriptor instead')
const DeviceRequest$json = {
  '1': 'DeviceRequest',
  '2': [
    {'1': 'account_id', '3': 1, '4': 1, '5': 9, '10': 'accountId'},
    {'1': 'role', '3': 2, '4': 1, '5': 9, '10': 'role'},
    {'1': 'device_id', '3': 3, '4': 1, '5': 9, '10': 'deviceId'},
  ],
};

/// Descriptor for `DeviceRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deviceRequestDescriptor = $convert.base64Decode(
    'Cg1EZXZpY2VSZXF1ZXN0Eh0KCmFjY291bnRfaWQYASABKAlSCWFjY291bnRJZBISCgRyb2xlGA'
    'IgASgJUgRyb2xlEhsKCWRldmljZV9pZBgDIAEoCVIIZGV2aWNlSWQ=');

@$core.Deprecated('Use deviceDescriptor instead')
const Device$json = {
  '1': 'Device',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'device_id', '3': 2, '4': 1, '5': 9, '10': 'deviceId'},
    {'1': 'client', '3': 3, '4': 1, '5': 9, '10': 'client'},
    {'1': 'os', '3': 4, '4': 1, '5': 9, '10': 'os'},
    {'1': 'model', '3': 5, '4': 1, '5': 9, '10': 'model'},
    {'1': 'app_version', '3': 6, '4': 1, '5': 9, '10': 'appVersion'},
    {
      '1': 'is_physical_device',
      '3': 7,
      '4': 1,
      '5': 8,
      '10': 'isPhysicalDevice'
    },
    {'1': 'device_category', '3': 8, '4': 1, '5': 9, '10': 'deviceCategory'},
    {'1': 'trusted', '3': 9, '4': 1, '5': 8, '10': 'trusted'},
    {'1': 'ip', '3': 10, '4': 1, '5': 9, '10': 'ip'},
    {'1': 'city', '3': 11, '4': 1, '5': 9, '10': 'city'},
    {'1': 'country', '3': 12, '4': 1, '5': 9, '10': 'country'},
    {'1': 'created_at', '3': 13, '4': 1, '5': 3, '10': 'createdAt'},
    {'1': 'seen_at', '3': 14, '4': 1, '5': 3, '10': 'seenAt'},
  ],
};

/// Descriptor for `Device`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deviceDescriptor = $convert.base64Decode(
    'CgZEZXZpY2USDgoCaWQYASABKAlSAmlkEhsKCWRldmljZV9pZBgCIAEoCVIIZGV2aWNlSWQSFg'
    'oGY2xpZW50GAMgASgJUgZjbGllbnQSDgoCb3MYBCABKAlSAm9zEhQKBW1vZGVsGAUgASgJUgVt'
    'b2RlbBIfCgthcHBfdmVyc2lvbhgGIAEoCVIKYXBwVmVyc2lvbhIsChJpc19waHlzaWNhbF9kZX'
    'ZpY2UYByABKAhSEGlzUGh5c2ljYWxEZXZpY2USJwoPZGV2aWNlX2NhdGVnb3J5GAggASgJUg5k'
    'ZXZpY2VDYXRlZ29yeRIYCgd0cnVzdGVkGAkgASgIUgd0cnVzdGVkEg4KAmlwGAogASgJUgJpcB'
    'ISCgRjaXR5GAsgASgJUgRjaXR5EhgKB2NvdW50cnkYDCABKAlSB2NvdW50cnkSHQoKY3JlYXRl'
    'ZF9hdBgNIAEoA1IJY3JlYXRlZEF0EhcKB3NlZW5fYXQYDiABKANSBnNlZW5BdA==');

@$core.Deprecated('Use deviceListResultDescriptor instead')
const DeviceListResult$json = {
  '1': 'DeviceListResult',
  '2': [
    {
      '1': 'devices',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.auth.v1.Device',
      '10': 'devices'
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

/// Descriptor for `DeviceListResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deviceListResultDescriptor = $convert.base64Decode(
    'ChBEZXZpY2VMaXN0UmVzdWx0EjgKB2RldmljZXMYASADKAsyHi5zY3JpYmUuY2xpZW50cy5hdX'
    'RoLnYxLkRldmljZVIHZGV2aWNlcxIoCgVlcnJvchgCIAEoCzISLnNjcmliZS52MS5GYWlsdXJl'
    'UgVlcnJvcg==');

@$core.Deprecated('Use kickResultDescriptor instead')
const KickResult$json = {
  '1': 'KickResult',
  '2': [
    {'1': 'kicked', '3': 1, '4': 1, '5': 8, '10': 'kicked'},
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

/// Descriptor for `KickResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List kickResultDescriptor = $convert.base64Decode(
    'CgpLaWNrUmVzdWx0EhYKBmtpY2tlZBgBIAEoCFIGa2lja2VkEigKBWVycm9yGAIgASgLMhIuc2'
    'NyaWJlLnYxLkZhaWx1cmVSBWVycm9y');

@$core.Deprecated('Use validateRequestDescriptor instead')
const ValidateRequest$json = {
  '1': 'ValidateRequest',
  '2': [
    {'1': 'password', '3': 1, '4': 1, '5': 9, '10': 'password'},
    {'1': 'email', '3': 2, '4': 1, '5': 9, '10': 'email'},
    {'1': 'phone', '3': 3, '4': 1, '5': 9, '10': 'phone'},
  ],
};

/// Descriptor for `ValidateRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List validateRequestDescriptor = $convert.base64Decode(
    'Cg9WYWxpZGF0ZVJlcXVlc3QSGgoIcGFzc3dvcmQYASABKAlSCHBhc3N3b3JkEhQKBWVtYWlsGA'
    'IgASgJUgVlbWFpbBIUCgVwaG9uZRgDIAEoCVIFcGhvbmU=');

@$core.Deprecated('Use validateResultDescriptor instead')
const ValidateResult$json = {
  '1': 'ValidateResult',
  '2': [
    {'1': 'valid', '3': 1, '4': 1, '5': 8, '10': 'valid'},
    {'1': 'violations', '3': 2, '4': 3, '5': 9, '10': 'violations'},
  ],
};

/// Descriptor for `ValidateResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List validateResultDescriptor = $convert.base64Decode(
    'Cg5WYWxpZGF0ZVJlc3VsdBIUCgV2YWxpZBgBIAEoCFIFdmFsaWQSHgoKdmlvbGF0aW9ucxgCIA'
    'MoCVIKdmlvbGF0aW9ucw==');

@$core.Deprecated('Use roleListRequestDescriptor instead')
const RoleListRequest$json = {
  '1': 'RoleListRequest',
};

/// Descriptor for `RoleListRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List roleListRequestDescriptor =
    $convert.base64Decode('Cg9Sb2xlTGlzdFJlcXVlc3Q=');

@$core.Deprecated('Use roleListResultDescriptor instead')
const RoleListResult$json = {
  '1': 'RoleListResult',
  '2': [
    {
      '1': 'roles',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.auth.v1.Role',
      '10': 'roles'
    },
  ],
};

/// Descriptor for `RoleListResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List roleListResultDescriptor = $convert.base64Decode(
    'Cg5Sb2xlTGlzdFJlc3VsdBIyCgVyb2xlcxgBIAMoCzIcLnNjcmliZS5jbGllbnRzLmF1dGgudj'
    'EuUm9sZVIFcm9sZXM=');

@$core.Deprecated('Use roleDescriptor instead')
const Role$json = {
  '1': 'Role',
  '2': [
    {'1': 'name', '3': 1, '4': 1, '5': 9, '10': 'name'},
    {'1': 'channels', '3': 2, '4': 3, '5': 9, '10': 'channels'},
    {'1': 'created', '3': 3, '4': 1, '5': 9, '10': 'created'},
  ],
};

/// Descriptor for `Role`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List roleDescriptor = $convert.base64Decode(
    'CgRSb2xlEhIKBG5hbWUYASABKAlSBG5hbWUSGgoIY2hhbm5lbHMYAiADKAlSCGNoYW5uZWxzEh'
    'gKB2NyZWF0ZWQYAyABKAlSB2NyZWF0ZWQ=');

const $core.Map<$core.String, $core.dynamic> AuthServiceBase$json = {
  '1': 'Auth',
  '2': [
    {
      '1': 'GetAccount',
      '2': '.scribe.clients.auth.v1.AccountRequest',
      '3': '.scribe.clients.auth.v1.AccountResult'
    },
    {
      '1': 'DeleteAccount',
      '2': '.scribe.clients.auth.v1.AccountRequest',
      '3': '.scribe.clients.auth.v1.BanResult'
    },
    {
      '1': 'Ban',
      '2': '.scribe.clients.auth.v1.BanRequest',
      '3': '.scribe.clients.auth.v1.BanResult'
    },
    {
      '1': 'Unban',
      '2': '.scribe.clients.auth.v1.AccountRequest',
      '3': '.scribe.clients.auth.v1.BanResult'
    },
    {
      '1': 'ListBans',
      '2': '.scribe.clients.auth.v1.BanListRequest',
      '3': '.scribe.clients.auth.v1.BanListResult'
    },
    {
      '1': 'ListDevices',
      '2': '.scribe.clients.auth.v1.DeviceRequest',
      '3': '.scribe.clients.auth.v1.DeviceListResult'
    },
    {
      '1': 'KickDevice',
      '2': '.scribe.clients.auth.v1.DeviceRequest',
      '3': '.scribe.clients.auth.v1.KickResult'
    },
    {
      '1': 'KickAllDevices',
      '2': '.scribe.clients.auth.v1.DeviceRequest',
      '3': '.scribe.clients.auth.v1.KickResult'
    },
    {
      '1': 'ListRoles',
      '2': '.scribe.clients.auth.v1.RoleListRequest',
      '3': '.scribe.clients.auth.v1.RoleListResult'
    },
    {
      '1': 'Validate',
      '2': '.scribe.clients.auth.v1.ValidateRequest',
      '3': '.scribe.clients.auth.v1.ValidateResult'
    },
  ],
};

@$core.Deprecated('Use authServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    AuthServiceBase$messageJson = {
  '.scribe.clients.auth.v1.AccountRequest': AccountRequest$json,
  '.scribe.clients.auth.v1.AccountResult': AccountResult$json,
  '.scribe.clients.auth.v1.Account': Account$json,
  '.scribe.clients.auth.v1.Ban': Ban$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.auth.v1.BanResult': BanResult$json,
  '.scribe.clients.auth.v1.BanRequest': BanRequest$json,
  '.scribe.clients.auth.v1.BanListRequest': BanListRequest$json,
  '.scribe.clients.auth.v1.BanListResult': BanListResult$json,
  '.scribe.clients.auth.v1.ListedBan': ListedBan$json,
  '.scribe.clients.auth.v1.DeviceRequest': DeviceRequest$json,
  '.scribe.clients.auth.v1.DeviceListResult': DeviceListResult$json,
  '.scribe.clients.auth.v1.Device': Device$json,
  '.scribe.clients.auth.v1.KickResult': KickResult$json,
  '.scribe.clients.auth.v1.RoleListRequest': RoleListRequest$json,
  '.scribe.clients.auth.v1.RoleListResult': RoleListResult$json,
  '.scribe.clients.auth.v1.Role': Role$json,
  '.scribe.clients.auth.v1.ValidateRequest': ValidateRequest$json,
  '.scribe.clients.auth.v1.ValidateResult': ValidateResult$json,
};

/// Descriptor for `Auth`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List authServiceDescriptor = $convert.base64Decode(
    'CgRBdXRoElsKCkdldEFjY291bnQSJi5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLkFjY291bnRSZX'
    'F1ZXN0GiUuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5BY2NvdW50UmVzdWx0EloKDURlbGV0ZUFj'
    'Y291bnQSJi5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLkFjY291bnRSZXF1ZXN0GiEuc2NyaWJlLm'
    'NsaWVudHMuYXV0aC52MS5CYW5SZXN1bHQSTAoDQmFuEiIuc2NyaWJlLmNsaWVudHMuYXV0aC52'
    'MS5CYW5SZXF1ZXN0GiEuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5CYW5SZXN1bHQSUgoFVW5iYW'
    '4SJi5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLkFjY291bnRSZXF1ZXN0GiEuc2NyaWJlLmNsaWVu'
    'dHMuYXV0aC52MS5CYW5SZXN1bHQSWQoITGlzdEJhbnMSJi5zY3JpYmUuY2xpZW50cy5hdXRoLn'
    'YxLkJhbkxpc3RSZXF1ZXN0GiUuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5CYW5MaXN0UmVzdWx0'
    'El4KC0xpc3REZXZpY2VzEiUuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5EZXZpY2VSZXF1ZXN0Gi'
    'guc2NyaWJlLmNsaWVudHMuYXV0aC52MS5EZXZpY2VMaXN0UmVzdWx0ElcKCktpY2tEZXZpY2US'
    'JS5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLkRldmljZVJlcXVlc3QaIi5zY3JpYmUuY2xpZW50cy'
    '5hdXRoLnYxLktpY2tSZXN1bHQSWwoOS2lja0FsbERldmljZXMSJS5zY3JpYmUuY2xpZW50cy5h'
    'dXRoLnYxLkRldmljZVJlcXVlc3QaIi5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLktpY2tSZXN1bH'
    'QSXAoJTGlzdFJvbGVzEicuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5Sb2xlTGlzdFJlcXVlc3Qa'
    'Ji5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLlJvbGVMaXN0UmVzdWx0ElsKCFZhbGlkYXRlEicuc2'
    'NyaWJlLmNsaWVudHMuYXV0aC52MS5WYWxpZGF0ZVJlcXVlc3QaJi5zY3JpYmUuY2xpZW50cy5h'
    'dXRoLnYxLlZhbGlkYXRlUmVzdWx0');
