// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/security/vpn/protocol/vpn.proto.

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

@$core.Deprecated('Use vpnDescriptor instead')
const Vpn$json = {
  '1': 'Vpn',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'name', '3': 2, '4': 1, '5': 9, '10': 'name'},
    {'1': 'enabled', '3': 3, '4': 1, '5': 8, '10': 'enabled'},
    {'1': 'created_at', '3': 4, '4': 1, '5': 3, '10': 'createdAt'},
    {'1': 'last_handshake_at', '3': 5, '4': 1, '5': 3, '10': 'lastHandshakeAt'},
  ],
};

/// Descriptor for `Vpn`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List vpnDescriptor = $convert.base64Decode(
    'CgNWcG4SDgoCaWQYASABKAlSAmlkEhIKBG5hbWUYAiABKAlSBG5hbWUSGAoHZW5hYmxlZBgDIA'
    'EoCFIHZW5hYmxlZBIdCgpjcmVhdGVkX2F0GAQgASgDUgljcmVhdGVkQXQSKgoRbGFzdF9oYW5k'
    'c2hha2VfYXQYBSABKANSD2xhc3RIYW5kc2hha2VBdA==');

@$core.Deprecated('Use vpnResultDescriptor instead')
const VpnResult$json = {
  '1': 'VpnResult',
  '2': [
    {
      '1': 'vpn',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.vpn.v1.Vpn',
      '10': 'vpn'
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

/// Descriptor for `VpnResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List vpnResultDescriptor = $convert.base64Decode(
    'CglWcG5SZXN1bHQSLAoDdnBuGAEgASgLMhouc2NyaWJlLmNsaWVudHMudnBuLnYxLlZwblIDdn'
    'BuEigKBWVycm9yGAIgASgLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVycm9y');

@$core.Deprecated('Use voidResultDescriptor instead')
const VoidResult$json = {
  '1': 'VoidResult',
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

/// Descriptor for `VoidResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List voidResultDescriptor = $convert.base64Decode(
    'CgpWb2lkUmVzdWx0EigKBWVycm9yGAEgASgLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVycm9y');

@$core.Deprecated('Use vpnRefDescriptor instead')
const VpnRef$json = {
  '1': 'VpnRef',
  '2': [
    {'1': 'vpn_id', '3': 1, '4': 1, '5': 9, '10': 'vpnId'},
  ],
};

/// Descriptor for `VpnRef`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List vpnRefDescriptor =
    $convert.base64Decode('CgZWcG5SZWYSFQoGdnBuX2lkGAEgASgJUgV2cG5JZA==');

@$core.Deprecated('Use ownerRefDescriptor instead')
const OwnerRef$json = {
  '1': 'OwnerRef',
  '2': [
    {'1': 'name', '3': 1, '4': 1, '5': 9, '10': 'name'},
  ],
};

/// Descriptor for `OwnerRef`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List ownerRefDescriptor =
    $convert.base64Decode('CghPd25lclJlZhISCgRuYW1lGAEgASgJUgRuYW1l');

@$core.Deprecated('Use createRequestDescriptor instead')
const CreateRequest$json = {
  '1': 'CreateRequest',
  '2': [
    {'1': 'name', '3': 1, '4': 1, '5': 9, '10': 'name'},
  ],
};

/// Descriptor for `CreateRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List createRequestDescriptor =
    $convert.base64Decode('Cg1DcmVhdGVSZXF1ZXN0EhIKBG5hbWUYASABKAlSBG5hbWU=');

@$core.Deprecated('Use renameRequestDescriptor instead')
const RenameRequest$json = {
  '1': 'RenameRequest',
  '2': [
    {'1': 'vpn_id', '3': 1, '4': 1, '5': 9, '10': 'vpnId'},
    {'1': 'name', '3': 2, '4': 1, '5': 9, '10': 'name'},
  ],
};

/// Descriptor for `RenameRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List renameRequestDescriptor = $convert.base64Decode(
    'Cg1SZW5hbWVSZXF1ZXN0EhUKBnZwbl9pZBgBIAEoCVIFdnBuSWQSEgoEbmFtZRgCIAEoCVIEbm'
    'FtZQ==');

@$core.Deprecated('Use paginationRequestDescriptor instead')
const PaginationRequest$json = {
  '1': 'PaginationRequest',
  '2': [
    {'1': 'offset', '3': 1, '4': 1, '5': 13, '10': 'offset'},
    {'1': 'size', '3': 2, '4': 1, '5': 13, '10': 'size'},
  ],
};

/// Descriptor for `PaginationRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List paginationRequestDescriptor = $convert.base64Decode(
    'ChFQYWdpbmF0aW9uUmVxdWVzdBIWCgZvZmZzZXQYASABKA1SBm9mZnNldBISCgRzaXplGAIgAS'
    'gNUgRzaXpl');

@$core.Deprecated('Use paginationResultDescriptor instead')
const PaginationResult$json = {
  '1': 'PaginationResult',
  '2': [
    {
      '1': 'vpns',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.vpn.v1.Vpn',
      '10': 'vpns'
    },
    {'1': 'total', '3': 2, '4': 1, '5': 4, '10': 'total'},
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

/// Descriptor for `PaginationResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List paginationResultDescriptor = $convert.base64Decode(
    'ChBQYWdpbmF0aW9uUmVzdWx0Ei4KBHZwbnMYASADKAsyGi5zY3JpYmUuY2xpZW50cy52cG4udj'
    'EuVnBuUgR2cG5zEhQKBXRvdGFsGAIgASgEUgV0b3RhbBIoCgVlcnJvchgDIAEoCzISLnNjcmli'
    'ZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use configurationResultDescriptor instead')
const ConfigurationResult$json = {
  '1': 'ConfigurationResult',
  '2': [
    {'1': 'configuration', '3': 1, '4': 1, '5': 9, '10': 'configuration'},
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

/// Descriptor for `ConfigurationResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List configurationResultDescriptor = $convert.base64Decode(
    'ChNDb25maWd1cmF0aW9uUmVzdWx0EiQKDWNvbmZpZ3VyYXRpb24YASABKAlSDWNvbmZpZ3VyYX'
    'Rpb24SKAoFZXJyb3IYAiABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use qrcodeResultDescriptor instead')
const QrcodeResult$json = {
  '1': 'QrcodeResult',
  '2': [
    {'1': 'qrcode', '3': 1, '4': 1, '5': 9, '10': 'qrcode'},
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

/// Descriptor for `QrcodeResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List qrcodeResultDescriptor = $convert.base64Decode(
    'CgxRcmNvZGVSZXN1bHQSFgoGcXJjb2RlGAEgASgJUgZxcmNvZGUSKAoFZXJyb3IYAiABKAsyEi'
    '5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> VpnAdminServiceBase$json = {
  '1': 'VpnAdmin',
  '2': [
    {
      '1': 'Get',
      '2': '.scribe.clients.vpn.v1.VpnRef',
      '3': '.scribe.clients.vpn.v1.VpnResult'
    },
    {
      '1': 'GetByOwner',
      '2': '.scribe.clients.vpn.v1.OwnerRef',
      '3': '.scribe.clients.vpn.v1.VpnResult'
    },
    {
      '1': 'Create',
      '2': '.scribe.clients.vpn.v1.CreateRequest',
      '3': '.scribe.clients.vpn.v1.VpnResult'
    },
    {
      '1': 'Delete',
      '2': '.scribe.clients.vpn.v1.VpnRef',
      '3': '.scribe.clients.vpn.v1.VoidResult'
    },
    {
      '1': 'DeleteAll',
      '2': '.scribe.clients.vpn.v1.OwnerRef',
      '3': '.scribe.clients.vpn.v1.VoidResult'
    },
    {
      '1': 'Enable',
      '2': '.scribe.clients.vpn.v1.VpnRef',
      '3': '.scribe.clients.vpn.v1.VoidResult'
    },
    {
      '1': 'Disable',
      '2': '.scribe.clients.vpn.v1.VpnRef',
      '3': '.scribe.clients.vpn.v1.VoidResult'
    },
    {
      '1': 'DisableAll',
      '2': '.scribe.clients.vpn.v1.OwnerRef',
      '3': '.scribe.clients.vpn.v1.VoidResult'
    },
    {
      '1': 'Rename',
      '2': '.scribe.clients.vpn.v1.RenameRequest',
      '3': '.scribe.clients.vpn.v1.VoidResult'
    },
    {
      '1': 'Pagination',
      '2': '.scribe.clients.vpn.v1.PaginationRequest',
      '3': '.scribe.clients.vpn.v1.PaginationResult'
    },
    {
      '1': 'Configuration',
      '2': '.scribe.clients.vpn.v1.VpnRef',
      '3': '.scribe.clients.vpn.v1.ConfigurationResult'
    },
    {
      '1': 'Qrcode',
      '2': '.scribe.clients.vpn.v1.VpnRef',
      '3': '.scribe.clients.vpn.v1.QrcodeResult'
    },
  ],
};

@$core.Deprecated('Use vpnAdminServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    VpnAdminServiceBase$messageJson = {
  '.scribe.clients.vpn.v1.VpnRef': VpnRef$json,
  '.scribe.clients.vpn.v1.VpnResult': VpnResult$json,
  '.scribe.clients.vpn.v1.Vpn': Vpn$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.vpn.v1.OwnerRef': OwnerRef$json,
  '.scribe.clients.vpn.v1.CreateRequest': CreateRequest$json,
  '.scribe.clients.vpn.v1.VoidResult': VoidResult$json,
  '.scribe.clients.vpn.v1.RenameRequest': RenameRequest$json,
  '.scribe.clients.vpn.v1.PaginationRequest': PaginationRequest$json,
  '.scribe.clients.vpn.v1.PaginationResult': PaginationResult$json,
  '.scribe.clients.vpn.v1.ConfigurationResult': ConfigurationResult$json,
  '.scribe.clients.vpn.v1.QrcodeResult': QrcodeResult$json,
};

/// Descriptor for `VpnAdmin`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List vpnAdminServiceDescriptor = $convert.base64Decode(
    'CghWcG5BZG1pbhJGCgNHZXQSHS5zY3JpYmUuY2xpZW50cy52cG4udjEuVnBuUmVmGiAuc2NyaW'
    'JlLmNsaWVudHMudnBuLnYxLlZwblJlc3VsdBJPCgpHZXRCeU93bmVyEh8uc2NyaWJlLmNsaWVu'
    'dHMudnBuLnYxLk93bmVyUmVmGiAuc2NyaWJlLmNsaWVudHMudnBuLnYxLlZwblJlc3VsdBJQCg'
    'ZDcmVhdGUSJC5zY3JpYmUuY2xpZW50cy52cG4udjEuQ3JlYXRlUmVxdWVzdBogLnNjcmliZS5j'
    'bGllbnRzLnZwbi52MS5WcG5SZXN1bHQSSgoGRGVsZXRlEh0uc2NyaWJlLmNsaWVudHMudnBuLn'
    'YxLlZwblJlZhohLnNjcmliZS5jbGllbnRzLnZwbi52MS5Wb2lkUmVzdWx0Ek8KCURlbGV0ZUFs'
    'bBIfLnNjcmliZS5jbGllbnRzLnZwbi52MS5Pd25lclJlZhohLnNjcmliZS5jbGllbnRzLnZwbi'
    '52MS5Wb2lkUmVzdWx0EkoKBkVuYWJsZRIdLnNjcmliZS5jbGllbnRzLnZwbi52MS5WcG5SZWYa'
    'IS5zY3JpYmUuY2xpZW50cy52cG4udjEuVm9pZFJlc3VsdBJLCgdEaXNhYmxlEh0uc2NyaWJlLm'
    'NsaWVudHMudnBuLnYxLlZwblJlZhohLnNjcmliZS5jbGllbnRzLnZwbi52MS5Wb2lkUmVzdWx0'
    'ElAKCkRpc2FibGVBbGwSHy5zY3JpYmUuY2xpZW50cy52cG4udjEuT3duZXJSZWYaIS5zY3JpYm'
    'UuY2xpZW50cy52cG4udjEuVm9pZFJlc3VsdBJRCgZSZW5hbWUSJC5zY3JpYmUuY2xpZW50cy52'
    'cG4udjEuUmVuYW1lUmVxdWVzdBohLnNjcmliZS5jbGllbnRzLnZwbi52MS5Wb2lkUmVzdWx0El'
    '8KClBhZ2luYXRpb24SKC5zY3JpYmUuY2xpZW50cy52cG4udjEuUGFnaW5hdGlvblJlcXVlc3Qa'
    'Jy5zY3JpYmUuY2xpZW50cy52cG4udjEuUGFnaW5hdGlvblJlc3VsdBJaCg1Db25maWd1cmF0aW'
    '9uEh0uc2NyaWJlLmNsaWVudHMudnBuLnYxLlZwblJlZhoqLnNjcmliZS5jbGllbnRzLnZwbi52'
    'MS5Db25maWd1cmF0aW9uUmVzdWx0EkwKBlFyY29kZRIdLnNjcmliZS5jbGllbnRzLnZwbi52MS'
    '5WcG5SZWYaIy5zY3JpYmUuY2xpZW50cy52cG4udjEuUXJjb2RlUmVzdWx0');
