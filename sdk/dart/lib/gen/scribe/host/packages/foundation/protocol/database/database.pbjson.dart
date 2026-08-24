// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/foundation/protocol/database/database.proto.

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

@$core.Deprecated('Use operationDescriptor instead')
const Operation$json = {
  '1': 'Operation',
  '2': [
    {'1': 'OPERATION_UNSPECIFIED', '2': 0},
    {'1': 'OPERATION_SELECT', '2': 1},
    {'1': 'OPERATION_INSERT', '2': 2},
    {'1': 'OPERATION_UPDATE', '2': 3},
    {'1': 'OPERATION_UPSERT', '2': 4},
    {'1': 'OPERATION_DELETE', '2': 5},
    {'1': 'OPERATION_RPC', '2': 6},
  ],
};

/// Descriptor for `Operation`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List operationDescriptor = $convert.base64Decode(
    'CglPcGVyYXRpb24SGQoVT1BFUkFUSU9OX1VOU1BFQ0lGSUVEEAASFAoQT1BFUkFUSU9OX1NFTE'
    'VDVBABEhQKEE9QRVJBVElPTl9JTlNFUlQQAhIUChBPUEVSQVRJT05fVVBEQVRFEAMSFAoQT1BF'
    'UkFUSU9OX1VQU0VSVBAEEhQKEE9QRVJBVElPTl9ERUxFVEUQBRIRCg1PUEVSQVRJT05fUlBDEA'
    'Y=');

@$core.Deprecated('Use filterOperatorDescriptor instead')
const FilterOperator$json = {
  '1': 'FilterOperator',
  '2': [
    {'1': 'FILTER_OPERATOR_UNSPECIFIED', '2': 0},
    {'1': 'FILTER_OPERATOR_EQ', '2': 1},
    {'1': 'FILTER_OPERATOR_NEQ', '2': 2},
    {'1': 'FILTER_OPERATOR_GT', '2': 3},
    {'1': 'FILTER_OPERATOR_GTE', '2': 4},
    {'1': 'FILTER_OPERATOR_LT', '2': 5},
    {'1': 'FILTER_OPERATOR_LTE', '2': 6},
    {'1': 'FILTER_OPERATOR_LIKE', '2': 7},
    {'1': 'FILTER_OPERATOR_ILIKE', '2': 8},
    {'1': 'FILTER_OPERATOR_IN', '2': 9},
    {'1': 'FILTER_OPERATOR_IS', '2': 10},
    {'1': 'FILTER_OPERATOR_CONTAINS', '2': 11},
    {'1': 'FILTER_OPERATOR_CONTAINED_BY', '2': 12},
    {'1': 'FILTER_OPERATOR_OVERLAPS', '2': 13},
    {'1': 'FILTER_OPERATOR_TEXT_SEARCH', '2': 14},
  ],
};

/// Descriptor for `FilterOperator`. Decode as a `google.protobuf.EnumDescriptorProto`.
final $typed_data.Uint8List filterOperatorDescriptor = $convert.base64Decode(
    'Cg5GaWx0ZXJPcGVyYXRvchIfChtGSUxURVJfT1BFUkFUT1JfVU5TUEVDSUZJRUQQABIWChJGSU'
    'xURVJfT1BFUkFUT1JfRVEQARIXChNGSUxURVJfT1BFUkFUT1JfTkVREAISFgoSRklMVEVSX09Q'
    'RVJBVE9SX0dUEAMSFwoTRklMVEVSX09QRVJBVE9SX0dURRAEEhYKEkZJTFRFUl9PUEVSQVRPUl'
    '9MVBAFEhcKE0ZJTFRFUl9PUEVSQVRPUl9MVEUQBhIYChRGSUxURVJfT1BFUkFUT1JfTElLRRAH'
    'EhkKFUZJTFRFUl9PUEVSQVRPUl9JTElLRRAIEhYKEkZJTFRFUl9PUEVSQVRPUl9JThAJEhYKEk'
    'ZJTFRFUl9PUEVSQVRPUl9JUxAKEhwKGEZJTFRFUl9PUEVSQVRPUl9DT05UQUlOUxALEiAKHEZJ'
    'TFRFUl9PUEVSQVRPUl9DT05UQUlORURfQlkQDBIcChhGSUxURVJfT1BFUkFUT1JfT1ZFUkxBUF'
    'MQDRIfChtGSUxURVJfT1BFUkFUT1JfVEVYVF9TRUFSQ0gQDg==');

@$core.Deprecated('Use filterDescriptor instead')
const Filter$json = {
  '1': 'Filter',
  '2': [
    {'1': 'column', '3': 1, '4': 1, '5': 9, '10': 'column'},
    {
      '1': 'operator',
      '3': 2,
      '4': 1,
      '5': 14,
      '6': '.scribe.clients.database.v1.FilterOperator',
      '10': 'operator'
    },
    {
      '1': 'value',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'value'
    },
    {'1': 'negated', '3': 4, '4': 1, '5': 8, '10': 'negated'},
  ],
};

/// Descriptor for `Filter`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List filterDescriptor = $convert.base64Decode(
    'CgZGaWx0ZXISFgoGY29sdW1uGAEgASgJUgZjb2x1bW4SRgoIb3BlcmF0b3IYAiABKA4yKi5zY3'
    'JpYmUuY2xpZW50cy5kYXRhYmFzZS52MS5GaWx0ZXJPcGVyYXRvclIIb3BlcmF0b3ISJQoFdmFs'
    'dWUYAyABKAsyDy5zY3JpYmUudjEuSnNvblIFdmFsdWUSGAoHbmVnYXRlZBgEIAEoCFIHbmVnYX'
    'RlZA==');

@$core.Deprecated('Use filterGroupDescriptor instead')
const FilterGroup$json = {
  '1': 'FilterGroup',
  '2': [
    {
      '1': 'filters',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.database.v1.Filter',
      '10': 'filters'
    },
    {
      '1': 'groups',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.database.v1.FilterGroup',
      '10': 'groups'
    },
    {'1': 'disjunction', '3': 3, '4': 1, '5': 8, '10': 'disjunction'},
  ],
};

/// Descriptor for `FilterGroup`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List filterGroupDescriptor = $convert.base64Decode(
    'CgtGaWx0ZXJHcm91cBI8CgdmaWx0ZXJzGAEgAygLMiIuc2NyaWJlLmNsaWVudHMuZGF0YWJhc2'
    'UudjEuRmlsdGVyUgdmaWx0ZXJzEj8KBmdyb3VwcxgCIAMoCzInLnNjcmliZS5jbGllbnRzLmRh'
    'dGFiYXNlLnYxLkZpbHRlckdyb3VwUgZncm91cHMSIAoLZGlzanVuY3Rpb24YAyABKAhSC2Rpc2'
    'p1bmN0aW9u');

@$core.Deprecated('Use orderDescriptor instead')
const Order$json = {
  '1': 'Order',
  '2': [
    {'1': 'column', '3': 1, '4': 1, '5': 9, '10': 'column'},
    {'1': 'descending', '3': 2, '4': 1, '5': 8, '10': 'descending'},
    {'1': 'nulls_first', '3': 3, '4': 1, '5': 8, '10': 'nullsFirst'},
  ],
};

/// Descriptor for `Order`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List orderDescriptor = $convert.base64Decode(
    'CgVPcmRlchIWCgZjb2x1bW4YASABKAlSBmNvbHVtbhIeCgpkZXNjZW5kaW5nGAIgASgIUgpkZX'
    'NjZW5kaW5nEh8KC251bGxzX2ZpcnN0GAMgASgIUgpudWxsc0ZpcnN0');

@$core.Deprecated('Use rangeDescriptor instead')
const Range$json = {
  '1': 'Range',
  '2': [
    {'1': 'limit', '3': 1, '4': 1, '5': 13, '10': 'limit'},
    {'1': 'offset', '3': 2, '4': 1, '5': 13, '10': 'offset'},
  ],
};

/// Descriptor for `Range`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List rangeDescriptor = $convert.base64Decode(
    'CgVSYW5nZRIUCgVsaW1pdBgBIAEoDVIFbGltaXQSFgoGb2Zmc2V0GAIgASgNUgZvZmZzZXQ=');

@$core.Deprecated('Use queryDescriptor instead')
const Query$json = {
  '1': 'Query',
  '2': [
    {'1': 'table', '3': 1, '4': 1, '5': 9, '10': 'table'},
    {
      '1': 'operation',
      '3': 2,
      '4': 1,
      '5': 14,
      '6': '.scribe.clients.database.v1.Operation',
      '10': 'operation'
    },
    {'1': 'select', '3': 3, '4': 3, '5': 9, '10': 'select'},
    {
      '1': 'where',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.database.v1.FilterGroup',
      '10': 'where'
    },
    {
      '1': 'order',
      '3': 5,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.database.v1.Order',
      '10': 'order'
    },
    {
      '1': 'range',
      '3': 6,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.database.v1.Range',
      '10': 'range'
    },
    {'1': 'single', '3': 7, '4': 1, '5': 8, '10': 'single'},
    {'1': 'count_exact', '3': 8, '4': 1, '5': 8, '10': 'countExact'},
    {
      '1': 'payload',
      '3': 9,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'payload'
    },
    {'1': 'on_conflict', '3': 10, '4': 3, '5': 9, '10': 'onConflict'},
    {'1': 'rpc_name', '3': 11, '4': 1, '5': 9, '10': 'rpcName'},
    {
      '1': 'rpc_args',
      '3': 12,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'rpcArgs'
    },
  ],
};

/// Descriptor for `Query`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queryDescriptor = $convert.base64Decode(
    'CgVRdWVyeRIUCgV0YWJsZRgBIAEoCVIFdGFibGUSQwoJb3BlcmF0aW9uGAIgASgOMiUuc2NyaW'
    'JlLmNsaWVudHMuZGF0YWJhc2UudjEuT3BlcmF0aW9uUglvcGVyYXRpb24SFgoGc2VsZWN0GAMg'
    'AygJUgZzZWxlY3QSPQoFd2hlcmUYBCABKAsyJy5zY3JpYmUuY2xpZW50cy5kYXRhYmFzZS52MS'
    '5GaWx0ZXJHcm91cFIFd2hlcmUSNwoFb3JkZXIYBSADKAsyIS5zY3JpYmUuY2xpZW50cy5kYXRh'
    'YmFzZS52MS5PcmRlclIFb3JkZXISNwoFcmFuZ2UYBiABKAsyIS5zY3JpYmUuY2xpZW50cy5kYX'
    'RhYmFzZS52MS5SYW5nZVIFcmFuZ2USFgoGc2luZ2xlGAcgASgIUgZzaW5nbGUSHwoLY291bnRf'
    'ZXhhY3QYCCABKAhSCmNvdW50RXhhY3QSKQoHcGF5bG9hZBgJIAEoCzIPLnNjcmliZS52MS5Kc2'
    '9uUgdwYXlsb2FkEh8KC29uX2NvbmZsaWN0GAogAygJUgpvbkNvbmZsaWN0EhkKCHJwY19uYW1l'
    'GAsgASgJUgdycGNOYW1lEioKCHJwY19hcmdzGAwgASgLMg8uc2NyaWJlLnYxLkpzb25SB3JwY0'
    'FyZ3M=');

@$core.Deprecated('Use queryResultDescriptor instead')
const QueryResult$json = {
  '1': 'QueryResult',
  '2': [
    {
      '1': 'data',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'data'
    },
    {'1': 'count', '3': 2, '4': 1, '5': 4, '10': 'count'},
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

/// Descriptor for `QueryResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queryResultDescriptor = $convert.base64Decode(
    'CgtRdWVyeVJlc3VsdBIjCgRkYXRhGAEgASgLMg8uc2NyaWJlLnYxLkpzb25SBGRhdGESFAoFY2'
    '91bnQYAiABKARSBWNvdW50EigKBWVycm9yGAMgASgLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVy'
    'cm9y');

@$core.Deprecated('Use queryBatchDescriptor instead')
const QueryBatch$json = {
  '1': 'QueryBatch',
  '2': [
    {
      '1': 'queries',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.database.v1.Query',
      '10': 'queries'
    },
  ],
};

/// Descriptor for `QueryBatch`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queryBatchDescriptor = $convert.base64Decode(
    'CgpRdWVyeUJhdGNoEjsKB3F1ZXJpZXMYASADKAsyIS5zY3JpYmUuY2xpZW50cy5kYXRhYmFzZS'
    '52MS5RdWVyeVIHcXVlcmllcw==');

@$core.Deprecated('Use queryResultBatchDescriptor instead')
const QueryResultBatch$json = {
  '1': 'QueryResultBatch',
  '2': [
    {
      '1': 'results',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.database.v1.QueryResult',
      '10': 'results'
    },
  ],
};

/// Descriptor for `QueryResultBatch`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queryResultBatchDescriptor = $convert.base64Decode(
    'ChBRdWVyeVJlc3VsdEJhdGNoEkEKB3Jlc3VsdHMYASADKAsyJy5zY3JpYmUuY2xpZW50cy5kYX'
    'RhYmFzZS52MS5RdWVyeVJlc3VsdFIHcmVzdWx0cw==');

const $core.Map<$core.String, $core.dynamic> DatabaseServiceBase$json = {
  '1': 'Database',
  '2': [
    {
      '1': 'Execute',
      '2': '.scribe.clients.database.v1.Query',
      '3': '.scribe.clients.database.v1.QueryResult'
    },
    {
      '1': 'ExecuteBatch',
      '2': '.scribe.clients.database.v1.QueryBatch',
      '3': '.scribe.clients.database.v1.QueryResultBatch'
    },
  ],
};

@$core.Deprecated('Use databaseServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    DatabaseServiceBase$messageJson = {
  '.scribe.clients.database.v1.Query': Query$json,
  '.scribe.clients.database.v1.FilterGroup': FilterGroup$json,
  '.scribe.clients.database.v1.Filter': Filter$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.database.v1.Order': Order$json,
  '.scribe.clients.database.v1.Range': Range$json,
  '.scribe.clients.database.v1.QueryResult': QueryResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.database.v1.QueryBatch': QueryBatch$json,
  '.scribe.clients.database.v1.QueryResultBatch': QueryResultBatch$json,
};

/// Descriptor for `Database`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List databaseServiceDescriptor = $convert.base64Decode(
    'CghEYXRhYmFzZRJVCgdFeGVjdXRlEiEuc2NyaWJlLmNsaWVudHMuZGF0YWJhc2UudjEuUXVlcn'
    'kaJy5zY3JpYmUuY2xpZW50cy5kYXRhYmFzZS52MS5RdWVyeVJlc3VsdBJkCgxFeGVjdXRlQmF0'
    'Y2gSJi5zY3JpYmUuY2xpZW50cy5kYXRhYmFzZS52MS5RdWVyeUJhdGNoGiwuc2NyaWJlLmNsaW'
    'VudHMuZGF0YWJhc2UudjEuUXVlcnlSZXN1bHRCYXRjaA==');
