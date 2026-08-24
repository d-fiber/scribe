// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/search/protocol/search.proto.

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

@$core.Deprecated('Use queueRequestDescriptor instead')
const QueueRequest$json = {
  '1': 'QueueRequest',
  '2': [
    {'1': 'index', '3': 1, '4': 1, '5': 9, '10': 'index'},
    {'1': 'ids', '3': 2, '4': 3, '5': 9, '10': 'ids'},
  ],
};

/// Descriptor for `QueueRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queueRequestDescriptor = $convert.base64Decode(
    'CgxRdWV1ZVJlcXVlc3QSFAoFaW5kZXgYASABKAlSBWluZGV4EhAKA2lkcxgCIAMoCVIDaWRz');

@$core.Deprecated('Use queueResultDescriptor instead')
const QueueResult$json = {
  '1': 'QueueResult',
  '2': [
    {'1': 'queued', '3': 1, '4': 1, '5': 8, '10': 'queued'},
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

/// Descriptor for `QueueResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List queueResultDescriptor = $convert.base64Decode(
    'CgtRdWV1ZVJlc3VsdBIWCgZxdWV1ZWQYASABKAhSBnF1ZXVlZBIoCgVlcnJvchgCIAEoCzISLn'
    'NjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use searchRequestDescriptor instead')
const SearchRequest$json = {
  '1': 'SearchRequest',
  '2': [
    {'1': 'index', '3': 1, '4': 1, '5': 9, '10': 'index'},
    {
      '1': 'params',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'params'
    },
  ],
};

/// Descriptor for `SearchRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List searchRequestDescriptor = $convert.base64Decode(
    'Cg1TZWFyY2hSZXF1ZXN0EhQKBWluZGV4GAEgASgJUgVpbmRleBInCgZwYXJhbXMYAiABKAsyDy'
    '5zY3JpYmUudjEuSnNvblIGcGFyYW1z');

@$core.Deprecated('Use searchResultDescriptor instead')
const SearchResult$json = {
  '1': 'SearchResult',
  '2': [
    {
      '1': 'page',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'page'
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

/// Descriptor for `SearchResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List searchResultDescriptor = $convert.base64Decode(
    'CgxTZWFyY2hSZXN1bHQSIwoEcGFnZRgBIAEoCzIPLnNjcmliZS52MS5Kc29uUgRwYWdlEigKBW'
    'Vycm9yGAIgASgLMhIuc2NyaWJlLnYxLkZhaWx1cmVSBWVycm9y');

const $core.Map<$core.String, $core.dynamic> SearchServiceBase$json = {
  '1': 'Search',
  '2': [
    {
      '1': 'Add',
      '2': '.scribe.clients.search.v1.QueueRequest',
      '3': '.scribe.clients.search.v1.QueueResult'
    },
    {
      '1': 'Delete',
      '2': '.scribe.clients.search.v1.QueueRequest',
      '3': '.scribe.clients.search.v1.QueueResult'
    },
    {
      '1': 'Search',
      '2': '.scribe.clients.search.v1.SearchRequest',
      '3': '.scribe.clients.search.v1.SearchResult'
    },
  ],
};

@$core.Deprecated('Use searchServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    SearchServiceBase$messageJson = {
  '.scribe.clients.search.v1.QueueRequest': QueueRequest$json,
  '.scribe.clients.search.v1.QueueResult': QueueResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.search.v1.SearchRequest': SearchRequest$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.search.v1.SearchResult': SearchResult$json,
};

/// Descriptor for `Search`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List searchServiceDescriptor = $convert.base64Decode(
    'CgZTZWFyY2gSVAoDQWRkEiYuc2NyaWJlLmNsaWVudHMuc2VhcmNoLnYxLlF1ZXVlUmVxdWVzdB'
    'olLnNjcmliZS5jbGllbnRzLnNlYXJjaC52MS5RdWV1ZVJlc3VsdBJXCgZEZWxldGUSJi5zY3Jp'
    'YmUuY2xpZW50cy5zZWFyY2gudjEuUXVldWVSZXF1ZXN0GiUuc2NyaWJlLmNsaWVudHMuc2Vhcm'
    'NoLnYxLlF1ZXVlUmVzdWx0ElkKBlNlYXJjaBInLnNjcmliZS5jbGllbnRzLnNlYXJjaC52MS5T'
    'ZWFyY2hSZXF1ZXN0GiYuc2NyaWJlLmNsaWVudHMuc2VhcmNoLnYxLlNlYXJjaFJlc3VsdA==');
