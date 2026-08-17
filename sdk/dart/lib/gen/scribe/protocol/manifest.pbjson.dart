// This is a generated file - do not edit.
//
// Generated from scribe/protocol/manifest.proto.

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

@$core.Deprecated('Use rateLimiterDescriptor instead')
const RateLimiter$json = {
  '1': 'RateLimiter',
  '2': [
    {'1': 'limit', '3': 1, '4': 1, '5': 13, '10': 'limit'},
    {
      '1': 'window',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Time',
      '10': 'window'
    },
    {
      '1': 'penalty',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Time',
      '10': 'penalty'
    },
    {
      '1': 'max_penalty',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Time',
      '10': 'maxPenalty'
    },
  ],
};

/// Descriptor for `RateLimiter`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List rateLimiterDescriptor = $convert.base64Decode(
    'CgtSYXRlTGltaXRlchIUCgVsaW1pdBgBIAEoDVIFbGltaXQSJwoGd2luZG93GAIgASgLMg8uc2'
    'NyaWJlLnYxLlRpbWVSBndpbmRvdxIpCgdwZW5hbHR5GAMgASgLMg8uc2NyaWJlLnYxLlRpbWVS'
    'B3BlbmFsdHkSMAoLbWF4X3BlbmFsdHkYBCABKAsyDy5zY3JpYmUudjEuVGltZVIKbWF4UGVuYW'
    'x0eQ==');

@$core.Deprecated('Use routeDescriptor instead')
const Route$json = {
  '1': 'Route',
  '2': [
    {'1': 'route_id', '3': 1, '4': 1, '5': 9, '10': 'routeId'},
    {
      '1': 'method',
      '3': 2,
      '4': 1,
      '5': 14,
      '6': '.scribe.v1.Method',
      '10': 'method'
    },
    {'1': 'path', '3': 3, '4': 1, '5': 9, '10': 'path'},
    {
      '1': 'access',
      '3': 5,
      '4': 3,
      '5': 14,
      '6': '.scribe.v1.Caller',
      '10': 'access'
    },
    {
      '1': 'rate_limit',
      '3': 6,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.RateLimiter',
      '10': 'rateLimit'
    },
    {
      '1': 'needs',
      '3': 7,
      '4': 3,
      '5': 14,
      '6': '.scribe.v1.Need',
      '10': 'needs'
    },
    {'1': 'webhook_verified', '3': 8, '4': 1, '5': 8, '10': 'webhookVerified'},
    {'1': 'rate_limit_key', '3': 9, '4': 1, '5': 9, '10': 'rateLimitKey'},
    {
      '1': 'required_permissions',
      '3': 10,
      '4': 3,
      '5': 9,
      '10': 'requiredPermissions'
    },
    {'1': 'node', '3': 11, '4': 1, '5': 9, '10': 'node'},
  ],
  '9': [
    {'1': 4, '2': 5},
  ],
  '10': ['mount'],
};

/// Descriptor for `Route`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List routeDescriptor = $convert.base64Decode(
    'CgVSb3V0ZRIZCghyb3V0ZV9pZBgBIAEoCVIHcm91dGVJZBIpCgZtZXRob2QYAiABKA4yES5zY3'
    'JpYmUudjEuTWV0aG9kUgZtZXRob2QSEgoEcGF0aBgDIAEoCVIEcGF0aBIpCgZhY2Nlc3MYBSAD'
    'KA4yES5zY3JpYmUudjEuQ2FsbGVyUgZhY2Nlc3MSNQoKcmF0ZV9saW1pdBgGIAEoCzIWLnNjcm'
    'liZS52MS5SYXRlTGltaXRlclIJcmF0ZUxpbWl0EiUKBW5lZWRzGAcgAygOMg8uc2NyaWJlLnYx'
    'Lk5lZWRSBW5lZWRzEikKEHdlYmhvb2tfdmVyaWZpZWQYCCABKAhSD3dlYmhvb2tWZXJpZmllZB'
    'IkCg5yYXRlX2xpbWl0X2tleRgJIAEoCVIMcmF0ZUxpbWl0S2V5EjEKFHJlcXVpcmVkX3Blcm1p'
    'c3Npb25zGAogAygJUhNyZXF1aXJlZFBlcm1pc3Npb25zEhIKBG5vZGUYCyABKAlSBG5vZGVKBA'
    'gEEAVSBW1vdW50');

@$core.Deprecated('Use nodeDeclarationDescriptor instead')
const NodeDeclaration$json = {
  '1': 'NodeDeclaration',
  '2': [
    {'1': 'name', '3': 1, '4': 1, '5': 9, '10': 'name'},
    {'1': 'public', '3': 2, '4': 1, '5': 8, '10': 'public'},
    {'1': 'log_sink', '3': 3, '4': 1, '5': 8, '10': 'logSink'},
  ],
};

/// Descriptor for `NodeDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List nodeDeclarationDescriptor = $convert.base64Decode(
    'Cg9Ob2RlRGVjbGFyYXRpb24SEgoEbmFtZRgBIAEoCVIEbmFtZRIWCgZwdWJsaWMYAiABKAhSBn'
    'B1YmxpYxIZCghsb2dfc2luaxgDIAEoCFIHbG9nU2luaw==');

@$core.Deprecated('Use hookDeclarationDescriptor instead')
const HookDeclaration$json = {
  '1': 'HookDeclaration',
  '2': [
    {'1': 'hook_id', '3': 1, '4': 1, '5': 9, '10': 'hookId'},
    {'1': 'event', '3': 2, '4': 1, '5': 9, '10': 'event'},
    {'1': 'priority', '3': 3, '4': 1, '5': 13, '10': 'priority'},
  ],
};

/// Descriptor for `HookDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List hookDeclarationDescriptor = $convert.base64Decode(
    'Cg9Ib29rRGVjbGFyYXRpb24SFwoHaG9va19pZBgBIAEoCVIGaG9va0lkEhQKBWV2ZW50GAIgAS'
    'gJUgVldmVudBIaCghwcmlvcml0eRgDIAEoDVIIcHJpb3JpdHk=');

@$core.Deprecated('Use queueDeclarationDescriptor instead')
const QueueDeclaration$json = {
  '1': 'QueueDeclaration',
  '2': [
    {'1': 'queue_id', '3': 1, '4': 1, '5': 9, '10': 'queueId'},
    {'1': 'name', '3': 2, '4': 1, '5': 9, '10': 'name'},
    {'1': 'batch_size', '3': 3, '4': 1, '5': 13, '10': 'batchSize'},
    {
      '1': 'visibility_timeout',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Time',
      '10': 'visibilityTimeout'
    },
    {'1': 'max_attempts', '3': 5, '4': 1, '5': 13, '10': 'maxAttempts'},
  ],
};

/// Descriptor for `QueueDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queueDeclarationDescriptor = $convert.base64Decode(
    'ChBRdWV1ZURlY2xhcmF0aW9uEhkKCHF1ZXVlX2lkGAEgASgJUgdxdWV1ZUlkEhIKBG5hbWUYAi'
    'ABKAlSBG5hbWUSHQoKYmF0Y2hfc2l6ZRgDIAEoDVIJYmF0Y2hTaXplEj4KEnZpc2liaWxpdHlf'
    'dGltZW91dBgEIAEoCzIPLnNjcmliZS52MS5UaW1lUhF2aXNpYmlsaXR5VGltZW91dBIhCgxtYX'
    'hfYXR0ZW1wdHMYBSABKA1SC21heEF0dGVtcHRz');

@$core.Deprecated('Use cronDeclarationDescriptor instead')
const CronDeclaration$json = {
  '1': 'CronDeclaration',
  '2': [
    {'1': 'cron_id', '3': 1, '4': 1, '5': 9, '10': 'cronId'},
    {'1': 'name', '3': 2, '4': 1, '5': 9, '10': 'name'},
    {'1': 'schedule', '3': 3, '4': 1, '5': 9, '10': 'schedule'},
  ],
};

/// Descriptor for `CronDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List cronDeclarationDescriptor = $convert.base64Decode(
    'Cg9Dcm9uRGVjbGFyYXRpb24SFwoHY3Jvbl9pZBgBIAEoCVIGY3JvbklkEhIKBG5hbWUYAiABKA'
    'lSBG5hbWUSGgoIc2NoZWR1bGUYAyABKAlSCHNjaGVkdWxl');

@$core.Deprecated('Use searcherDeclarationDescriptor instead')
const SearcherDeclaration$json = {
  '1': 'SearcherDeclaration',
  '2': [
    {'1': 'entity', '3': 1, '4': 1, '5': 9, '10': 'entity'},
    {'1': 'index', '3': 2, '4': 1, '5': 9, '10': 'index'},
    {
      '1': 'mappings',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'mappings'
    },
    {
      '1': 'settings',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'settings'
    },
  ],
};

/// Descriptor for `SearcherDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List searcherDeclarationDescriptor = $convert.base64Decode(
    'ChNTZWFyY2hlckRlY2xhcmF0aW9uEhYKBmVudGl0eRgBIAEoCVIGZW50aXR5EhQKBWluZGV4GA'
    'IgASgJUgVpbmRleBIrCghtYXBwaW5ncxgDIAEoCzIPLnNjcmliZS52MS5Kc29uUghtYXBwaW5n'
    'cxIrCghzZXR0aW5ncxgEIAEoCzIPLnNjcmliZS52MS5Kc29uUghzZXR0aW5ncw==');

@$core.Deprecated('Use realtimeDeclarationDescriptor instead')
const RealtimeDeclaration$json = {
  '1': 'RealtimeDeclaration',
  '2': [
    {'1': 'entity', '3': 1, '4': 1, '5': 9, '10': 'entity'},
    {'1': 'events', '3': 2, '4': 3, '5': 9, '10': 'events'},
    {
      '1': 'scope',
      '3': 3,
      '4': 1,
      '5': 14,
      '6': '.scribe.v1.EventScope',
      '10': 'scope'
    },
  ],
};

/// Descriptor for `RealtimeDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List realtimeDeclarationDescriptor = $convert.base64Decode(
    'ChNSZWFsdGltZURlY2xhcmF0aW9uEhYKBmVudGl0eRgBIAEoCVIGZW50aXR5EhYKBmV2ZW50cx'
    'gCIAMoCVIGZXZlbnRzEisKBXNjb3BlGAMgASgOMhUuc2NyaWJlLnYxLkV2ZW50U2NvcGVSBXNj'
    'b3Bl');

@$core.Deprecated('Use storageDeclarationDescriptor instead')
const StorageDeclaration$json = {
  '1': 'StorageDeclaration',
  '2': [
    {'1': 'folder', '3': 1, '4': 1, '5': 9, '10': 'folder'},
    {'1': 'path_template', '3': 2, '4': 1, '5': 9, '10': 'pathTemplate'},
    {
      '1': 'max_size',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Size',
      '10': 'maxSize'
    },
    {'1': 'mime_types', '3': 4, '4': 3, '5': 9, '10': 'mimeTypes'},
  ],
};

/// Descriptor for `StorageDeclaration`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List storageDeclarationDescriptor = $convert.base64Decode(
    'ChJTdG9yYWdlRGVjbGFyYXRpb24SFgoGZm9sZGVyGAEgASgJUgZmb2xkZXISIwoNcGF0aF90ZW'
    '1wbGF0ZRgCIAEoCVIMcGF0aFRlbXBsYXRlEioKCG1heF9zaXplGAMgASgLMg8uc2NyaWJlLnYx'
    'LlNpemVSB21heFNpemUSHQoKbWltZV90eXBlcxgEIAMoCVIJbWltZVR5cGVz');

@$core.Deprecated('Use manifestDescriptor instead')
const Manifest$json = {
  '1': 'Manifest',
  '2': [
    {'1': 'protocol_version', '3': 1, '4': 1, '5': 9, '10': 'protocolVersion'},
    {'1': 'worker_language', '3': 2, '4': 1, '5': 9, '10': 'workerLanguage'},
    {
      '1': 'routes',
      '3': 3,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.Route',
      '10': 'routes'
    },
    {
      '1': 'hooks',
      '3': 4,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.HookDeclaration',
      '10': 'hooks'
    },
    {
      '1': 'queues',
      '3': 5,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.QueueDeclaration',
      '10': 'queues'
    },
    {
      '1': 'crons',
      '3': 6,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.CronDeclaration',
      '10': 'crons'
    },
    {
      '1': 'searchers',
      '3': 7,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.SearcherDeclaration',
      '10': 'searchers'
    },
    {
      '1': 'realtimes',
      '3': 8,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.RealtimeDeclaration',
      '10': 'realtimes'
    },
    {
      '1': 'storages',
      '3': 9,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.StorageDeclaration',
      '10': 'storages'
    },
    {'1': 'sdk_version', '3': 10, '4': 1, '5': 9, '10': 'sdkVersion'},
    {
      '1': 'nodes',
      '3': 11,
      '4': 3,
      '5': 11,
      '6': '.scribe.v1.NodeDeclaration',
      '10': 'nodes'
    },
    {'1': 'root_log_sink', '3': 12, '4': 1, '5': 8, '10': 'rootLogSink'},
  ],
};

/// Descriptor for `Manifest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List manifestDescriptor = $convert.base64Decode(
    'CghNYW5pZmVzdBIpChBwcm90b2NvbF92ZXJzaW9uGAEgASgJUg9wcm90b2NvbFZlcnNpb24SJw'
    'oPd29ya2VyX2xhbmd1YWdlGAIgASgJUg53b3JrZXJMYW5ndWFnZRIoCgZyb3V0ZXMYAyADKAsy'
    'EC5zY3JpYmUudjEuUm91dGVSBnJvdXRlcxIwCgVob29rcxgEIAMoCzIaLnNjcmliZS52MS5Ib2'
    '9rRGVjbGFyYXRpb25SBWhvb2tzEjMKBnF1ZXVlcxgFIAMoCzIbLnNjcmliZS52MS5RdWV1ZURl'
    'Y2xhcmF0aW9uUgZxdWV1ZXMSMAoFY3JvbnMYBiADKAsyGi5zY3JpYmUudjEuQ3JvbkRlY2xhcm'
    'F0aW9uUgVjcm9ucxI8CglzZWFyY2hlcnMYByADKAsyHi5zY3JpYmUudjEuU2VhcmNoZXJEZWNs'
    'YXJhdGlvblIJc2VhcmNoZXJzEjwKCXJlYWx0aW1lcxgIIAMoCzIeLnNjcmliZS52MS5SZWFsdG'
    'ltZURlY2xhcmF0aW9uUglyZWFsdGltZXMSOQoIc3RvcmFnZXMYCSADKAsyHS5zY3JpYmUudjEu'
    'U3RvcmFnZURlY2xhcmF0aW9uUghzdG9yYWdlcxIfCgtzZGtfdmVyc2lvbhgKIAEoCVIKc2RrVm'
    'Vyc2lvbhIwCgVub2RlcxgLIAMoCzIaLnNjcmliZS52MS5Ob2RlRGVjbGFyYXRpb25SBW5vZGVz'
    'EiIKDXJvb3RfbG9nX3NpbmsYDCABKAhSC3Jvb3RMb2dTaW5r');

@$core.Deprecated('Use handshakeRequestDescriptor instead')
const HandshakeRequest$json = {
  '1': 'HandshakeRequest',
  '2': [
    {
      '1': 'host_protocol_version',
      '3': 1,
      '4': 1,
      '5': 9,
      '10': 'hostProtocolVersion'
    },
    {'1': 'host_endpoint', '3': 2, '4': 1, '5': 9, '10': 'hostEndpoint'},
    {'1': 'capability_token', '3': 3, '4': 1, '5': 9, '10': 'capabilityToken'},
  ],
};

/// Descriptor for `HandshakeRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List handshakeRequestDescriptor = $convert.base64Decode(
    'ChBIYW5kc2hha2VSZXF1ZXN0EjIKFWhvc3RfcHJvdG9jb2xfdmVyc2lvbhgBIAEoCVITaG9zdF'
    'Byb3RvY29sVmVyc2lvbhIjCg1ob3N0X2VuZHBvaW50GAIgASgJUgxob3N0RW5kcG9pbnQSKQoQ'
    'Y2FwYWJpbGl0eV90b2tlbhgDIAEoCVIPY2FwYWJpbGl0eVRva2Vu');

const $core.Map<$core.String, $core.dynamic> RegistrationServiceBase$json = {
  '1': 'Registration',
  '2': [
    {
      '1': 'Describe',
      '2': '.scribe.v1.HandshakeRequest',
      '3': '.scribe.v1.Manifest'
    },
  ],
};

@$core.Deprecated('Use registrationServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RegistrationServiceBase$messageJson = {
  '.scribe.v1.HandshakeRequest': HandshakeRequest$json,
  '.scribe.v1.Manifest': Manifest$json,
  '.scribe.v1.Route': Route$json,
  '.scribe.v1.RateLimiter': RateLimiter$json,
  '.scribe.v1.Time': $0.Time$json,
  '.scribe.v1.HookDeclaration': HookDeclaration$json,
  '.scribe.v1.QueueDeclaration': QueueDeclaration$json,
  '.scribe.v1.CronDeclaration': CronDeclaration$json,
  '.scribe.v1.SearcherDeclaration': SearcherDeclaration$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.v1.RealtimeDeclaration': RealtimeDeclaration$json,
  '.scribe.v1.StorageDeclaration': StorageDeclaration$json,
  '.scribe.v1.Size': $0.Size$json,
  '.scribe.v1.NodeDeclaration': NodeDeclaration$json,
};

/// Descriptor for `Registration`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List registrationServiceDescriptor = $convert.base64Decode(
    'CgxSZWdpc3RyYXRpb24SPAoIRGVzY3JpYmUSGy5zY3JpYmUudjEuSGFuZHNoYWtlUmVxdWVzdB'
    'oTLnNjcmliZS52MS5NYW5pZmVzdA==');
