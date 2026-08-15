// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/security/auth/protocol/auth.proto.

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

@$core.Deprecated('Use accountRequestDescriptor instead')
const AccountRequest$json = {
  '1': 'AccountRequest',
  '2': [
    {'1': 'user_id', '3': 1, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'email', '3': 2, '4': 1, '5': 9, '10': 'email'},
  ],
};

/// Descriptor for `AccountRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List accountRequestDescriptor = $convert.base64Decode(
    'Cg5BY2NvdW50UmVxdWVzdBIXCgd1c2VyX2lkGAEgASgJUgZ1c2VySWQSFAoFZW1haWwYAiABKA'
    'lSBWVtYWls');

@$core.Deprecated('Use accountDescriptor instead')
const Account$json = {
  '1': 'Account',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'email', '3': 2, '4': 1, '5': 9, '10': 'email'},
    {'1': 'phone', '3': 3, '4': 1, '5': 9, '10': 'phone'},
    {'1': 'email_confirmed', '3': 4, '4': 1, '5': 8, '10': 'emailConfirmed'},
    {'1': 'phone_confirmed', '3': 5, '4': 1, '5': 8, '10': 'phoneConfirmed'},
    {
      '1': 'app_metadata',
      '3': 6,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'appMetadata'
    },
    {
      '1': 'user_metadata',
      '3': 7,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'userMetadata'
    },
    {'1': 'created_at', '3': 8, '4': 1, '5': 3, '10': 'createdAt'},
  ],
};

/// Descriptor for `Account`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List accountDescriptor = $convert.base64Decode(
    'CgdBY2NvdW50Eg4KAmlkGAEgASgJUgJpZBIUCgVlbWFpbBgCIAEoCVIFZW1haWwSFAoFcGhvbm'
    'UYAyABKAlSBXBob25lEicKD2VtYWlsX2NvbmZpcm1lZBgEIAEoCFIOZW1haWxDb25maXJtZWQS'
    'JwoPcGhvbmVfY29uZmlybWVkGAUgASgIUg5waG9uZUNvbmZpcm1lZBIyCgxhcHBfbWV0YWRhdG'
    'EYBiABKAsyDy5zY3JpYmUudjEuSnNvblILYXBwTWV0YWRhdGESNAoNdXNlcl9tZXRhZGF0YRgH'
    'IAEoCzIPLnNjcmliZS52MS5Kc29uUgx1c2VyTWV0YWRhdGESHQoKY3JlYXRlZF9hdBgIIAEoA1'
    'IJY3JlYXRlZEF0');

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

@$core.Deprecated('Use updateAccountRequestDescriptor instead')
const UpdateAccountRequest$json = {
  '1': 'UpdateAccountRequest',
  '2': [
    {'1': 'user_id', '3': 1, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'email', '3': 2, '4': 1, '5': 9, '10': 'email'},
    {'1': 'phone', '3': 3, '4': 1, '5': 9, '10': 'phone'},
    {
      '1': 'user_metadata',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'userMetadata'
    },
  ],
};

/// Descriptor for `UpdateAccountRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List updateAccountRequestDescriptor = $convert.base64Decode(
    'ChRVcGRhdGVBY2NvdW50UmVxdWVzdBIXCgd1c2VyX2lkGAEgASgJUgZ1c2VySWQSFAoFZW1haW'
    'wYAiABKAlSBWVtYWlsEhQKBXBob25lGAMgASgJUgVwaG9uZRI0Cg11c2VyX21ldGFkYXRhGAQg'
    'ASgLMg8uc2NyaWJlLnYxLkpzb25SDHVzZXJNZXRhZGF0YQ==');

@$core.Deprecated('Use deleteAccountRequestDescriptor instead')
const DeleteAccountRequest$json = {
  '1': 'DeleteAccountRequest',
  '2': [
    {'1': 'user_id', '3': 1, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'soft', '3': 2, '4': 1, '5': 8, '10': 'soft'},
  ],
};

/// Descriptor for `DeleteAccountRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteAccountRequestDescriptor = $convert.base64Decode(
    'ChREZWxldGVBY2NvdW50UmVxdWVzdBIXCgd1c2VyX2lkGAEgASgJUgZ1c2VySWQSEgoEc29mdB'
    'gCIAEoCFIEc29mdA==');

@$core.Deprecated('Use deleteAccountResultDescriptor instead')
const DeleteAccountResult$json = {
  '1': 'DeleteAccountResult',
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

/// Descriptor for `DeleteAccountResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteAccountResultDescriptor = $convert.base64Decode(
    'ChNEZWxldGVBY2NvdW50UmVzdWx0EigKBWVycm9yGAEgASgLMhIuc2NyaWJlLnYxLkZhaWx1cm'
    'VSBWVycm9y');

@$core.Deprecated('Use sessionRequestDescriptor instead')
const SessionRequest$json = {
  '1': 'SessionRequest',
  '2': [
    {'1': 'session_id', '3': 1, '4': 1, '5': 9, '10': 'sessionId'},
    {'1': 'user_id', '3': 2, '4': 1, '5': 9, '10': 'userId'},
  ],
};

/// Descriptor for `SessionRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List sessionRequestDescriptor = $convert.base64Decode(
    'Cg5TZXNzaW9uUmVxdWVzdBIdCgpzZXNzaW9uX2lkGAEgASgJUglzZXNzaW9uSWQSFwoHdXNlcl'
    '9pZBgCIAEoCVIGdXNlcklk');

@$core.Deprecated('Use sessionSummaryDescriptor instead')
const SessionSummary$json = {
  '1': 'SessionSummary',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'user_id', '3': 2, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'created_at', '3': 3, '4': 1, '5': 3, '10': 'createdAt'},
    {'1': 'expires_at', '3': 4, '4': 1, '5': 3, '10': 'expiresAt'},
  ],
};

/// Descriptor for `SessionSummary`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List sessionSummaryDescriptor = $convert.base64Decode(
    'Cg5TZXNzaW9uU3VtbWFyeRIOCgJpZBgBIAEoCVICaWQSFwoHdXNlcl9pZBgCIAEoCVIGdXNlck'
    'lkEh0KCmNyZWF0ZWRfYXQYAyABKANSCWNyZWF0ZWRBdBIdCgpleHBpcmVzX2F0GAQgASgDUgll'
    'eHBpcmVzQXQ=');

@$core.Deprecated('Use sessionListResultDescriptor instead')
const SessionListResult$json = {
  '1': 'SessionListResult',
  '2': [
    {
      '1': 'sessions',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.auth.v1.SessionSummary',
      '10': 'sessions'
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

/// Descriptor for `SessionListResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List sessionListResultDescriptor = $convert.base64Decode(
    'ChFTZXNzaW9uTGlzdFJlc3VsdBJCCghzZXNzaW9ucxgBIAMoCzImLnNjcmliZS5jbGllbnRzLm'
    'F1dGgudjEuU2Vzc2lvblN1bW1hcnlSCHNlc3Npb25zEigKBWVycm9yGAIgASgLMhIuc2NyaWJl'
    'LnYxLkZhaWx1cmVSBWVycm9y');

@$core.Deprecated('Use signOutRequestDescriptor instead')
const SignOutRequest$json = {
  '1': 'SignOutRequest',
  '2': [
    {'1': 'user_id', '3': 1, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'session_id', '3': 2, '4': 1, '5': 9, '10': 'sessionId'},
    {'1': 'global', '3': 3, '4': 1, '5': 8, '10': 'global'},
  ],
};

/// Descriptor for `SignOutRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List signOutRequestDescriptor = $convert.base64Decode(
    'Cg5TaWduT3V0UmVxdWVzdBIXCgd1c2VyX2lkGAEgASgJUgZ1c2VySWQSHQoKc2Vzc2lvbl9pZB'
    'gCIAEoCVIJc2Vzc2lvbklkEhYKBmdsb2JhbBgDIAEoCFIGZ2xvYmFs');

@$core.Deprecated('Use signOutResultDescriptor instead')
const SignOutResult$json = {
  '1': 'SignOutResult',
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

/// Descriptor for `SignOutResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List signOutResultDescriptor = $convert.base64Decode(
    'Cg1TaWduT3V0UmVzdWx0EigKBWVycm9yGAEgASgLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVycm'
    '9y');

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

const $core.Map<$core.String, $core.dynamic> AuthServiceBase$json = {
  '1': 'Auth',
  '2': [
    {
      '1': 'GetAccount',
      '2': '.scribe.clients.auth.v1.AccountRequest',
      '3': '.scribe.clients.auth.v1.AccountResult'
    },
    {
      '1': 'UpdateAccount',
      '2': '.scribe.clients.auth.v1.UpdateAccountRequest',
      '3': '.scribe.clients.auth.v1.AccountResult'
    },
    {
      '1': 'DeleteAccount',
      '2': '.scribe.clients.auth.v1.DeleteAccountRequest',
      '3': '.scribe.clients.auth.v1.DeleteAccountResult'
    },
    {
      '1': 'ListSessions',
      '2': '.scribe.clients.auth.v1.SessionRequest',
      '3': '.scribe.clients.auth.v1.SessionListResult'
    },
    {
      '1': 'SignOut',
      '2': '.scribe.clients.auth.v1.SignOutRequest',
      '3': '.scribe.clients.auth.v1.SignOutResult'
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
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.auth.v1.UpdateAccountRequest': UpdateAccountRequest$json,
  '.scribe.clients.auth.v1.DeleteAccountRequest': DeleteAccountRequest$json,
  '.scribe.clients.auth.v1.DeleteAccountResult': DeleteAccountResult$json,
  '.scribe.clients.auth.v1.SessionRequest': SessionRequest$json,
  '.scribe.clients.auth.v1.SessionListResult': SessionListResult$json,
  '.scribe.clients.auth.v1.SessionSummary': SessionSummary$json,
  '.scribe.clients.auth.v1.SignOutRequest': SignOutRequest$json,
  '.scribe.clients.auth.v1.SignOutResult': SignOutResult$json,
  '.scribe.clients.auth.v1.ValidateRequest': ValidateRequest$json,
  '.scribe.clients.auth.v1.ValidateResult': ValidateResult$json,
};

/// Descriptor for `Auth`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List authServiceDescriptor = $convert.base64Decode(
    'CgRBdXRoElsKCkdldEFjY291bnQSJi5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLkFjY291bnRSZX'
    'F1ZXN0GiUuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5BY2NvdW50UmVzdWx0EmQKDVVwZGF0ZUFj'
    'Y291bnQSLC5zY3JpYmUuY2xpZW50cy5hdXRoLnYxLlVwZGF0ZUFjY291bnRSZXF1ZXN0GiUuc2'
    'NyaWJlLmNsaWVudHMuYXV0aC52MS5BY2NvdW50UmVzdWx0EmoKDURlbGV0ZUFjY291bnQSLC5z'
    'Y3JpYmUuY2xpZW50cy5hdXRoLnYxLkRlbGV0ZUFjY291bnRSZXF1ZXN0Gisuc2NyaWJlLmNsaW'
    'VudHMuYXV0aC52MS5EZWxldGVBY2NvdW50UmVzdWx0EmEKDExpc3RTZXNzaW9ucxImLnNjcmli'
    'ZS5jbGllbnRzLmF1dGgudjEuU2Vzc2lvblJlcXVlc3QaKS5zY3JpYmUuY2xpZW50cy5hdXRoLn'
    'YxLlNlc3Npb25MaXN0UmVzdWx0ElgKB1NpZ25PdXQSJi5zY3JpYmUuY2xpZW50cy5hdXRoLnYx'
    'LlNpZ25PdXRSZXF1ZXN0GiUuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5TaWduT3V0UmVzdWx0El'
    'sKCFZhbGlkYXRlEicuc2NyaWJlLmNsaWVudHMuYXV0aC52MS5WYWxpZGF0ZVJlcXVlc3QaJi5z'
    'Y3JpYmUuY2xpZW50cy5hdXRoLnYxLlZhbGlkYXRlUmVzdWx0');
