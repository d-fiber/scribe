// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/foundation/database/rest/protocol/rest.proto.

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

import '../../../../../../protocol/common.pbjson.dart' as $0;

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
      '6': '.scribe.clients.rest.v1.FilterOperator',
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
    'CgZGaWx0ZXISFgoGY29sdW1uGAEgASgJUgZjb2x1bW4SQgoIb3BlcmF0b3IYAiABKA4yJi5zY3'
    'JpYmUuY2xpZW50cy5yZXN0LnYxLkZpbHRlck9wZXJhdG9yUghvcGVyYXRvchIlCgV2YWx1ZRgD'
    'IAEoCzIPLnNjcmliZS52MS5Kc29uUgV2YWx1ZRIYCgduZWdhdGVkGAQgASgIUgduZWdhdGVk');

@$core.Deprecated('Use filterGroupDescriptor instead')
const FilterGroup$json = {
  '1': 'FilterGroup',
  '2': [
    {
      '1': 'filters',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.rest.v1.Filter',
      '10': 'filters'
    },
    {
      '1': 'groups',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.rest.v1.FilterGroup',
      '10': 'groups'
    },
    {'1': 'disjunction', '3': 3, '4': 1, '5': 8, '10': 'disjunction'},
  ],
};

/// Descriptor for `FilterGroup`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List filterGroupDescriptor = $convert.base64Decode(
    'CgtGaWx0ZXJHcm91cBI4CgdmaWx0ZXJzGAEgAygLMh4uc2NyaWJlLmNsaWVudHMucmVzdC52MS'
    '5GaWx0ZXJSB2ZpbHRlcnMSOwoGZ3JvdXBzGAIgAygLMiMuc2NyaWJlLmNsaWVudHMucmVzdC52'
    'MS5GaWx0ZXJHcm91cFIGZ3JvdXBzEiAKC2Rpc2p1bmN0aW9uGAMgASgIUgtkaXNqdW5jdGlvbg'
    '==');

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
      '6': '.scribe.clients.rest.v1.Operation',
      '10': 'operation'
    },
    {'1': 'select', '3': 3, '4': 3, '5': 9, '10': 'select'},
    {
      '1': 'where',
      '3': 4,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.rest.v1.FilterGroup',
      '10': 'where'
    },
    {
      '1': 'order',
      '3': 5,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.rest.v1.Order',
      '10': 'order'
    },
    {
      '1': 'range',
      '3': 6,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.rest.v1.Range',
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
    'CgVRdWVyeRIUCgV0YWJsZRgBIAEoCVIFdGFibGUSPwoJb3BlcmF0aW9uGAIgASgOMiEuc2NyaW'
    'JlLmNsaWVudHMucmVzdC52MS5PcGVyYXRpb25SCW9wZXJhdGlvbhIWCgZzZWxlY3QYAyADKAlS'
    'BnNlbGVjdBI5CgV3aGVyZRgEIAEoCzIjLnNjcmliZS5jbGllbnRzLnJlc3QudjEuRmlsdGVyR3'
    'JvdXBSBXdoZXJlEjMKBW9yZGVyGAUgAygLMh0uc2NyaWJlLmNsaWVudHMucmVzdC52MS5PcmRl'
    'clIFb3JkZXISMwoFcmFuZ2UYBiABKAsyHS5zY3JpYmUuY2xpZW50cy5yZXN0LnYxLlJhbmdlUg'
    'VyYW5nZRIWCgZzaW5nbGUYByABKAhSBnNpbmdsZRIfCgtjb3VudF9leGFjdBgIIAEoCFIKY291'
    'bnRFeGFjdBIpCgdwYXlsb2FkGAkgASgLMg8uc2NyaWJlLnYxLkpzb25SB3BheWxvYWQSHwoLb2'
    '5fY29uZmxpY3QYCiADKAlSCm9uQ29uZmxpY3QSGQoIcnBjX25hbWUYCyABKAlSB3JwY05hbWUS'
    'KgoIcnBjX2FyZ3MYDCABKAsyDy5zY3JpYmUudjEuSnNvblIHcnBjQXJncw==');

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

const $core.Map<$core.String, $core.dynamic> RestServiceBase$json = {
  '1': 'Rest',
  '2': [
    {
      '1': 'Execute',
      '2': '.scribe.clients.rest.v1.Query',
      '3': '.scribe.clients.rest.v1.QueryResult'
    },
  ],
};

@$core.Deprecated('Use restServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RestServiceBase$messageJson = {
  '.scribe.clients.rest.v1.Query': Query$json,
  '.scribe.clients.rest.v1.FilterGroup': FilterGroup$json,
  '.scribe.clients.rest.v1.Filter': Filter$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.rest.v1.Order': Order$json,
  '.scribe.clients.rest.v1.Range': Range$json,
  '.scribe.clients.rest.v1.QueryResult': QueryResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
};

/// Descriptor for `Rest`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List restServiceDescriptor = $convert.base64Decode(
    'CgRSZXN0Ek0KB0V4ZWN1dGUSHS5zY3JpYmUuY2xpZW50cy5yZXN0LnYxLlF1ZXJ5GiMuc2NyaW'
    'JlLmNsaWVudHMucmVzdC52MS5RdWVyeVJlc3VsdA==');
