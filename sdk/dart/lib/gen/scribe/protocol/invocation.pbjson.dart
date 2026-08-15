// This is a generated file - do not edit.
//
// Generated from scribe/protocol/invocation.proto.

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

import 'common.pbjson.dart' as $0;

@$core.Deprecated('Use rulesDescriptor instead')
const Rules$json = {
  '1': 'Rules',
  '2': [
    {'1': 'role', '3': 1, '4': 1, '5': 9, '10': 'role'},
    {'1': 'permissions', '3': 2, '4': 3, '5': 9, '10': 'permissions'},
  ],
};

/// Descriptor for `Rules`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List rulesDescriptor = $convert.base64Decode(
    'CgVSdWxlcxISCgRyb2xlGAEgASgJUgRyb2xlEiAKC3Blcm1pc3Npb25zGAIgAygJUgtwZXJtaX'
    'NzaW9ucw==');

@$core.Deprecated('Use identityDescriptor instead')
const Identity$json = {
  '1': 'Identity',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'email', '3': 2, '4': 1, '5': 9, '10': 'email'},
    {
      '1': 'caller',
      '3': 3,
      '4': 1,
      '5': 14,
      '6': '.scribe.v1.Caller',
      '10': 'caller'
    },
    {
      '1': 'rules',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Rules',
      '10': 'rules'
    },
  ],
};

/// Descriptor for `Identity`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List identityDescriptor = $convert.base64Decode(
    'CghJZGVudGl0eRIOCgJpZBgBIAEoCVICaWQSFAoFZW1haWwYAiABKAlSBWVtYWlsEikKBmNhbG'
    'xlchgDIAEoDjIRLnNjcmliZS52MS5DYWxsZXJSBmNhbGxlchImCgVydWxlcxgEIAEoCzIQLnNj'
    'cmliZS52MS5SdWxlc1IFcnVsZXM=');

@$core.Deprecated('Use localizationDescriptor instead')
const Localization$json = {
  '1': 'Localization',
  '2': [
    {'1': 'language', '3': 1, '4': 1, '5': 9, '10': 'language'},
    {'1': 'region', '3': 2, '4': 1, '5': 9, '10': 'region'},
    {'1': 'timezone', '3': 3, '4': 1, '5': 9, '10': 'timezone'},
  ],
};

/// Descriptor for `Localization`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List localizationDescriptor = $convert.base64Decode(
    'CgxMb2NhbGl6YXRpb24SGgoIbGFuZ3VhZ2UYASABKAlSCGxhbmd1YWdlEhYKBnJlZ2lvbhgCIA'
    'EoCVIGcmVnaW9uEhoKCHRpbWV6b25lGAMgASgJUgh0aW1lem9uZQ==');

@$core.Deprecated('Use deviceDescriptor instead')
const Device$json = {
  '1': 'Device',
  '2': [
    {'1': 'device_id', '3': 1, '4': 1, '5': 9, '10': 'deviceId'},
    {'1': 'client', '3': 2, '4': 1, '5': 9, '10': 'client'},
    {'1': 'os', '3': 3, '4': 1, '5': 9, '10': 'os'},
    {'1': 'model', '3': 4, '4': 1, '5': 9, '10': 'model'},
    {'1': 'app_version', '3': 5, '4': 1, '5': 9, '10': 'appVersion'},
    {
      '1': 'is_physical_device',
      '3': 6,
      '4': 1,
      '5': 8,
      '10': 'isPhysicalDevice'
    },
    {'1': 'device_category', '3': 7, '4': 1, '5': 9, '10': 'deviceCategory'},
    {
      '1': 'notification_token',
      '3': 8,
      '4': 1,
      '5': 9,
      '10': 'notificationToken'
    },
    {'1': 'device_token', '3': 9, '4': 1, '5': 9, '10': 'deviceToken'},
    {
      '1': 'localization',
      '3': 10,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Localization',
      '10': 'localization'
    },
    {'1': 'theme_mode', '3': 11, '4': 1, '5': 9, '10': 'themeMode'},
    {'1': 'binding', '3': 12, '4': 1, '5': 9, '10': 'binding'},
    {'1': 'iat', '3': 13, '4': 1, '5': 3, '10': 'iat'},
    {'1': 'nonce', '3': 14, '4': 1, '5': 9, '10': 'nonce'},
  ],
};

/// Descriptor for `Device`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deviceDescriptor = $convert.base64Decode(
    'CgZEZXZpY2USGwoJZGV2aWNlX2lkGAEgASgJUghkZXZpY2VJZBIWCgZjbGllbnQYAiABKAlSBm'
    'NsaWVudBIOCgJvcxgDIAEoCVICb3MSFAoFbW9kZWwYBCABKAlSBW1vZGVsEh8KC2FwcF92ZXJz'
    'aW9uGAUgASgJUgphcHBWZXJzaW9uEiwKEmlzX3BoeXNpY2FsX2RldmljZRgGIAEoCFIQaXNQaH'
    'lzaWNhbERldmljZRInCg9kZXZpY2VfY2F0ZWdvcnkYByABKAlSDmRldmljZUNhdGVnb3J5Ei0K'
    'Em5vdGlmaWNhdGlvbl90b2tlbhgIIAEoCVIRbm90aWZpY2F0aW9uVG9rZW4SIQoMZGV2aWNlX3'
    'Rva2VuGAkgASgJUgtkZXZpY2VUb2tlbhI7Cgxsb2NhbGl6YXRpb24YCiABKAsyFy5zY3JpYmUu'
    'djEuTG9jYWxpemF0aW9uUgxsb2NhbGl6YXRpb24SHQoKdGhlbWVfbW9kZRgLIAEoCVIJdGhlbW'
    'VNb2RlEhgKB2JpbmRpbmcYDCABKAlSB2JpbmRpbmcSEAoDaWF0GA0gASgDUgNpYXQSFAoFbm9u'
    'Y2UYDiABKAlSBW5vbmNl');

@$core.Deprecated('Use ipLocationDescriptor instead')
const IpLocation$json = {
  '1': 'IpLocation',
  '2': [
    {'1': 'city', '3': 1, '4': 1, '5': 9, '10': 'city'},
    {'1': 'country', '3': 2, '4': 1, '5': 9, '10': 'country'},
  ],
};

/// Descriptor for `IpLocation`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List ipLocationDescriptor = $convert.base64Decode(
    'CgpJcExvY2F0aW9uEhIKBGNpdHkYASABKAlSBGNpdHkSGAoHY291bnRyeRgCIAEoCVIHY291bn'
    'RyeQ==');

@$core.Deprecated('Use coordinatesDescriptor instead')
const Coordinates$json = {
  '1': 'Coordinates',
  '2': [
    {'1': 'lat', '3': 1, '4': 1, '5': 1, '10': 'lat'},
    {'1': 'lng', '3': 2, '4': 1, '5': 1, '10': 'lng'},
  ],
};

/// Descriptor for `Coordinates`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List coordinatesDescriptor = $convert.base64Decode(
    'CgtDb29yZGluYXRlcxIQCgNsYXQYASABKAFSA2xhdBIQCgNsbmcYAiABKAFSA2xuZw==');

@$core.Deprecated('Use requestDescriptor instead')
const Request$json = {
  '1': 'Request',
  '2': [
    {
      '1': 'method',
      '3': 1,
      '4': 1,
      '5': 14,
      '6': '.scribe.v1.Method',
      '10': 'method'
    },
    {'1': 'path', '3': 2, '4': 1, '5': 9, '10': 'path'},
    {
      '1': 'path_params',
      '3': 3,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.Request.PathParamsEntry',
      '10': 'pathParams'
    },
    {
      '1': 'query',
      '3': 4,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.Request.QueryEntry',
      '10': 'query'
    },
    {
      '1': 'headers',
      '3': 5,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.Request.HeadersEntry',
      '10': 'headers'
    },
    {'1': 'body', '3': 6, '4': 1, '5': 12, '10': 'body'},
    {'1': 'ip', '3': 7, '4': 1, '5': 9, '10': 'ip'},
    {'1': 'user_agent', '3': 8, '4': 1, '5': 9, '10': 'userAgent'},
    {'1': 'session_id', '3': 9, '4': 1, '5': 9, '10': 'sessionId'},
  ],
  '3': [
    Request_PathParamsEntry$json,
    Request_QueryEntry$json,
    Request_HeadersEntry$json
  ],
};

@$core.Deprecated('Use requestDescriptor instead')
const Request_PathParamsEntry$json = {
  '1': 'PathParamsEntry',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'value', '3': 2, '4': 1, '5': 9, '10': 'value'},
  ],
  '7': {'7': true},
};

@$core.Deprecated('Use requestDescriptor instead')
const Request_QueryEntry$json = {
  '1': 'QueryEntry',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'value', '3': 2, '4': 1, '5': 9, '10': 'value'},
  ],
  '7': {'7': true},
};

@$core.Deprecated('Use requestDescriptor instead')
const Request_HeadersEntry$json = {
  '1': 'HeadersEntry',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'value', '3': 2, '4': 1, '5': 9, '10': 'value'},
  ],
  '7': {'7': true},
};

/// Descriptor for `Request`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List requestDescriptor = $convert.base64Decode(
    'CgdSZXF1ZXN0EikKBm1ldGhvZBgBIAEoDjIRLnNjcmliZS52MS5NZXRob2RSBm1ldGhvZBISCg'
    'RwYXRoGAIgASgJUgRwYXRoEkMKC3BhdGhfcGFyYW1zGAMgAygLMiIuc2NyaWJlLnYxLlJlcXVl'
    'c3QuUGF0aFBhcmFtc0VudHJ5UgpwYXRoUGFyYW1zEjMKBXF1ZXJ5GAQgAygLMh0uc2NyaWJlLn'
    'YxLlJlcXVlc3QuUXVlcnlFbnRyeVIFcXVlcnkSOQoHaGVhZGVycxgFIAMoCzIfLnNjcmliZS52'
    'MS5SZXF1ZXN0LkhlYWRlcnNFbnRyeVIHaGVhZGVycxISCgRib2R5GAYgASgMUgRib2R5Eg4KAm'
    'lwGAcgASgJUgJpcBIdCgp1c2VyX2FnZW50GAggASgJUgl1c2VyQWdlbnQSHQoKc2Vzc2lvbl9p'
    'ZBgJIAEoCVIJc2Vzc2lvbklkGj0KD1BhdGhQYXJhbXNFbnRyeRIQCgNrZXkYASABKAlSA2tleR'
    'IUCgV2YWx1ZRgCIAEoCVIFdmFsdWU6AjgBGjgKClF1ZXJ5RW50cnkSEAoDa2V5GAEgASgJUgNr'
    'ZXkSFAoFdmFsdWUYAiABKAlSBXZhbHVlOgI4ARo6CgxIZWFkZXJzRW50cnkSEAoDa2V5GAEgAS'
    'gJUgNrZXkSFAoFdmFsdWUYAiABKAlSBXZhbHVlOgI4AQ==');

@$core.Deprecated('Use invocationDescriptor instead')
const Invocation$json = {
  '1': 'Invocation',
  '2': [
    {'1': 'invocation_id', '3': 1, '4': 1, '5': 9, '10': 'invocationId'},
    {'1': 'trace_id', '3': 2, '4': 1, '5': 9, '10': 'traceId'},
    {'1': 'route_id', '3': 3, '4': 1, '5': 9, '10': 'routeId'},
    {
      '1': 'request',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Request',
      '10': 'request'
    },
    {
      '1': 'identity',
      '3': 5,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Identity',
      '10': 'identity'
    },
    {
      '1': 'device',
      '3': 6,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Device',
      '10': 'device'
    },
    {
      '1': 'location',
      '3': 7,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.IpLocation',
      '10': 'location'
    },
    {'1': 'capability_token', '3': 8, '4': 1, '5': 9, '10': 'capabilityToken'},
  ],
};

/// Descriptor for `Invocation`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List invocationDescriptor = $convert.base64Decode(
    'CgpJbnZvY2F0aW9uEiMKDWludm9jYXRpb25faWQYASABKAlSDGludm9jYXRpb25JZBIZCgh0cm'
    'FjZV9pZBgCIAEoCVIHdHJhY2VJZBIZCghyb3V0ZV9pZBgDIAEoCVIHcm91dGVJZBIsCgdyZXF1'
    'ZXN0GAQgASgLMhIuc2NyaWJlLnYxLlJlcXVlc3RSB3JlcXVlc3QSLwoIaWRlbnRpdHkYBSABKA'
    'syEy5zY3JpYmUudjEuSWRlbnRpdHlSCGlkZW50aXR5EikKBmRldmljZRgGIAEoCzIRLnNjcmli'
    'ZS52MS5EZXZpY2VSBmRldmljZRIxCghsb2NhdGlvbhgHIAEoCzIVLnNjcmliZS52MS5JcExvY2'
    'F0aW9uUghsb2NhdGlvbhIpChBjYXBhYmlsaXR5X3Rva2VuGAggASgJUg9jYXBhYmlsaXR5VG9r'
    'ZW4=');

@$core.Deprecated('Use replyDescriptor instead')
const Reply$json = {
  '1': 'Reply',
  '2': [
    {'1': 'invocation_id', '3': 1, '4': 1, '5': 9, '10': 'invocationId'},
    {'1': 'status', '3': 2, '4': 1, '5': 13, '10': 'status'},
    {
      '1': 'headers',
      '3': 3,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.Reply.HeadersEntry',
      '10': 'headers'
    },
    {'1': 'body', '3': 4, '4': 1, '5': 12, '10': 'body'},
    {
      '1': 'failure',
      '3': 5,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Failure',
      '10': 'failure'
    },
  ],
  '3': [Reply_HeadersEntry$json],
};

@$core.Deprecated('Use replyDescriptor instead')
const Reply_HeadersEntry$json = {
  '1': 'HeadersEntry',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'value', '3': 2, '4': 1, '5': 9, '10': 'value'},
  ],
  '7': {'7': true},
};

/// Descriptor for `Reply`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List replyDescriptor = $convert.base64Decode(
    'CgVSZXBseRIjCg1pbnZvY2F0aW9uX2lkGAEgASgJUgxpbnZvY2F0aW9uSWQSFgoGc3RhdHVzGA'
    'IgASgNUgZzdGF0dXMSNwoHaGVhZGVycxgDIAMoCzIdLnNjcmliZS52MS5SZXBseS5IZWFkZXJz'
    'RW50cnlSB2hlYWRlcnMSEgoEYm9keRgEIAEoDFIEYm9keRIsCgdmYWlsdXJlGAUgASgLMhIuc2'
    'NyaWJlLnYxLkZhaWx1cmVSB2ZhaWx1cmUaOgoMSGVhZGVyc0VudHJ5EhAKA2tleRgBIAEoCVID'
    'a2V5EhQKBXZhbHVlGAIgASgJUgV2YWx1ZToCOAE=');

const $core.Map<$core.String, $core.dynamic> WorkerServiceBase$json = {
  '1': 'Worker',
  '2': [
    {'1': 'Invoke', '2': '.scribe.v1.Invocation', '3': '.scribe.v1.Reply'},
  ],
};

@$core.Deprecated('Use workerServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    WorkerServiceBase$messageJson = {
  '.scribe.v1.Invocation': Invocation$json,
  '.scribe.v1.Request': Request$json,
  '.scribe.v1.Request.PathParamsEntry': Request_PathParamsEntry$json,
  '.scribe.v1.Request.QueryEntry': Request_QueryEntry$json,
  '.scribe.v1.Request.HeadersEntry': Request_HeadersEntry$json,
  '.scribe.v1.Identity': Identity$json,
  '.scribe.v1.Rules': Rules$json,
  '.scribe.v1.Device': Device$json,
  '.scribe.v1.Localization': Localization$json,
  '.scribe.v1.IpLocation': IpLocation$json,
  '.scribe.v1.Reply': Reply$json,
  '.scribe.v1.Reply.HeadersEntry': Reply_HeadersEntry$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `Worker`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List workerServiceDescriptor = $convert.base64Decode(
    'CgZXb3JrZXISMQoGSW52b2tlEhUuc2NyaWJlLnYxLkludm9jYXRpb24aEC5zY3JpYmUudjEuUm'
    'VwbHk=');
