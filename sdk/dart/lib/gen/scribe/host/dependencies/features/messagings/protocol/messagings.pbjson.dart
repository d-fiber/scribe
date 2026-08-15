// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/messagings/protocol/messagings.proto.

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

@$core.Deprecated('Use recipientDescriptor instead')
const Recipient$json = {
  '1': 'Recipient',
  '2': [
    {'1': 'address', '3': 1, '4': 1, '5': 9, '10': 'address'},
    {'1': 'name', '3': 2, '4': 1, '5': 9, '10': 'name'},
  ],
};

/// Descriptor for `Recipient`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List recipientDescriptor = $convert.base64Decode(
    'CglSZWNpcGllbnQSGAoHYWRkcmVzcxgBIAEoCVIHYWRkcmVzcxISCgRuYW1lGAIgASgJUgRuYW'
    '1l');

@$core.Deprecated('Use mailRequestDescriptor instead')
const MailRequest$json = {
  '1': 'MailRequest',
  '2': [
    {'1': 'account', '3': 1, '4': 1, '5': 9, '10': 'account'},
    {
      '1': 'to',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.messagings.v1.Recipient',
      '10': 'to'
    },
    {
      '1': 'cc',
      '3': 3,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.messagings.v1.Recipient',
      '10': 'cc'
    },
    {
      '1': 'bcc',
      '3': 4,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.messagings.v1.Recipient',
      '10': 'bcc'
    },
    {'1': 'subject', '3': 5, '4': 1, '5': 9, '10': 'subject'},
    {'1': 'template', '3': 6, '4': 1, '5': 9, '10': 'template'},
    {
      '1': 'template_data',
      '3': 7,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'templateData'
    },
    {'1': 'html', '3': 8, '4': 1, '5': 9, '10': 'html'},
    {'1': 'text', '3': 9, '4': 1, '5': 9, '10': 'text'},
  ],
};

/// Descriptor for `MailRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List mailRequestDescriptor = $convert.base64Decode(
    'CgtNYWlsUmVxdWVzdBIYCgdhY2NvdW50GAEgASgJUgdhY2NvdW50EjcKAnRvGAIgAygLMicuc2'
    'NyaWJlLmNsaWVudHMubWVzc2FnaW5ncy52MS5SZWNpcGllbnRSAnRvEjcKAmNjGAMgAygLMicu'
    'c2NyaWJlLmNsaWVudHMubWVzc2FnaW5ncy52MS5SZWNpcGllbnRSAmNjEjkKA2JjYxgEIAMoCz'
    'InLnNjcmliZS5jbGllbnRzLm1lc3NhZ2luZ3MudjEuUmVjaXBpZW50UgNiY2MSGAoHc3ViamVj'
    'dBgFIAEoCVIHc3ViamVjdBIaCgh0ZW1wbGF0ZRgGIAEoCVIIdGVtcGxhdGUSNAoNdGVtcGxhdG'
    'VfZGF0YRgHIAEoCzIPLnNjcmliZS52MS5Kc29uUgx0ZW1wbGF0ZURhdGESEgoEaHRtbBgIIAEo'
    'CVIEaHRtbBISCgR0ZXh0GAkgASgJUgR0ZXh0');

@$core.Deprecated('Use mailResultDescriptor instead')
const MailResult$json = {
  '1': 'MailResult',
  '2': [
    {'1': 'message_id', '3': 1, '4': 1, '5': 9, '10': 'messageId'},
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

/// Descriptor for `MailResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List mailResultDescriptor = $convert.base64Decode(
    'CgpNYWlsUmVzdWx0Eh0KCm1lc3NhZ2VfaWQYASABKAlSCW1lc3NhZ2VJZBIoCgVlcnJvchgCIA'
    'EoCzISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use smsRequestDescriptor instead')
const SmsRequest$json = {
  '1': 'SmsRequest',
  '2': [
    {'1': 'to', '3': 1, '4': 1, '5': 9, '10': 'to'},
    {'1': 'template', '3': 2, '4': 1, '5': 9, '10': 'template'},
    {
      '1': 'template_data',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'templateData'
    },
    {'1': 'body', '3': 4, '4': 1, '5': 9, '10': 'body'},
  ],
};

/// Descriptor for `SmsRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List smsRequestDescriptor = $convert.base64Decode(
    'CgpTbXNSZXF1ZXN0Eg4KAnRvGAEgASgJUgJ0bxIaCgh0ZW1wbGF0ZRgCIAEoCVIIdGVtcGxhdG'
    'USNAoNdGVtcGxhdGVfZGF0YRgDIAEoCzIPLnNjcmliZS52MS5Kc29uUgx0ZW1wbGF0ZURhdGES'
    'EgoEYm9keRgEIAEoCVIEYm9keQ==');

@$core.Deprecated('Use smsResultDescriptor instead')
const SmsResult$json = {
  '1': 'SmsResult',
  '2': [
    {'1': 'message_id', '3': 1, '4': 1, '5': 9, '10': 'messageId'},
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

/// Descriptor for `SmsResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List smsResultDescriptor = $convert.base64Decode(
    'CglTbXNSZXN1bHQSHQoKbWVzc2FnZV9pZBgBIAEoCVIJbWVzc2FnZUlkEigKBWVycm9yGAIgAS'
    'gLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVycm9y');

@$core.Deprecated('Use pushRequestDescriptor instead')
const PushRequest$json = {
  '1': 'PushRequest',
  '2': [
    {'1': 'tokens', '3': 1, '4': 3, '5': 9, '10': 'tokens'},
    {'1': 'user_ids', '3': 2, '4': 3, '5': 9, '10': 'userIds'},
    {'1': 'template', '3': 3, '4': 1, '5': 9, '10': 'template'},
    {
      '1': 'template_data',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'templateData'
    },
    {'1': 'title', '3': 5, '4': 1, '5': 9, '10': 'title'},
    {'1': 'body', '3': 6, '4': 1, '5': 9, '10': 'body'},
    {
      '1': 'data',
      '3': 7,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'data'
    },
  ],
};

/// Descriptor for `PushRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List pushRequestDescriptor = $convert.base64Decode(
    'CgtQdXNoUmVxdWVzdBIWCgZ0b2tlbnMYASADKAlSBnRva2VucxIZCgh1c2VyX2lkcxgCIAMoCV'
    'IHdXNlcklkcxIaCgh0ZW1wbGF0ZRgDIAEoCVIIdGVtcGxhdGUSNAoNdGVtcGxhdGVfZGF0YRgE'
    'IAEoCzIPLnNjcmliZS52MS5Kc29uUgx0ZW1wbGF0ZURhdGESFAoFdGl0bGUYBSABKAlSBXRpdG'
    'xlEhIKBGJvZHkYBiABKAlSBGJvZHkSIwoEZGF0YRgHIAEoCzIPLnNjcmliZS52MS5Kc29uUgRk'
    'YXRh');

@$core.Deprecated('Use pushResultDescriptor instead')
const PushResult$json = {
  '1': 'PushResult',
  '2': [
    {'1': 'sent', '3': 1, '4': 1, '5': 13, '10': 'sent'},
    {'1': 'failed', '3': 2, '4': 1, '5': 13, '10': 'failed'},
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

/// Descriptor for `PushResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List pushResultDescriptor = $convert.base64Decode(
    'CgpQdXNoUmVzdWx0EhIKBHNlbnQYASABKA1SBHNlbnQSFgoGZmFpbGVkGAIgASgNUgZmYWlsZW'
    'QSKAoFZXJyb3IYAyABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> MessagingsServiceBase$json = {
  '1': 'Messagings',
  '2': [
    {
      '1': 'SendMail',
      '2': '.scribe.clients.messagings.v1.MailRequest',
      '3': '.scribe.clients.messagings.v1.MailResult'
    },
    {
      '1': 'SendSms',
      '2': '.scribe.clients.messagings.v1.SmsRequest',
      '3': '.scribe.clients.messagings.v1.SmsResult'
    },
    {
      '1': 'SendPush',
      '2': '.scribe.clients.messagings.v1.PushRequest',
      '3': '.scribe.clients.messagings.v1.PushResult'
    },
  ],
};

@$core.Deprecated('Use messagingsServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    MessagingsServiceBase$messageJson = {
  '.scribe.clients.messagings.v1.MailRequest': MailRequest$json,
  '.scribe.clients.messagings.v1.Recipient': Recipient$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.messagings.v1.MailResult': MailResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.messagings.v1.SmsRequest': SmsRequest$json,
  '.scribe.clients.messagings.v1.SmsResult': SmsResult$json,
  '.scribe.clients.messagings.v1.PushRequest': PushRequest$json,
  '.scribe.clients.messagings.v1.PushResult': PushResult$json,
};

/// Descriptor for `Messagings`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List messagingsServiceDescriptor = $convert.base64Decode(
    'CgpNZXNzYWdpbmdzEl8KCFNlbmRNYWlsEikuc2NyaWJlLmNsaWVudHMubWVzc2FnaW5ncy52MS'
    '5NYWlsUmVxdWVzdBooLnNjcmliZS5jbGllbnRzLm1lc3NhZ2luZ3MudjEuTWFpbFJlc3VsdBJc'
    'CgdTZW5kU21zEiguc2NyaWJlLmNsaWVudHMubWVzc2FnaW5ncy52MS5TbXNSZXF1ZXN0Gicuc2'
    'NyaWJlLmNsaWVudHMubWVzc2FnaW5ncy52MS5TbXNSZXN1bHQSXwoIU2VuZFB1c2gSKS5zY3Jp'
    'YmUuY2xpZW50cy5tZXNzYWdpbmdzLnYxLlB1c2hSZXF1ZXN0Giguc2NyaWJlLmNsaWVudHMubW'
    'Vzc2FnaW5ncy52MS5QdXNoUmVzdWx0');
