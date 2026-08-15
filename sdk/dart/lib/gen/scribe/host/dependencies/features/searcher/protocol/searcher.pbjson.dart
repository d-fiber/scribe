// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/searcher/protocol/searcher.proto.

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

@$core.Deprecated('Use documentDescriptor instead')
const Document$json = {
  '1': 'Document',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {
      '1': 'source',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'source'
    },
  ],
};

/// Descriptor for `Document`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List documentDescriptor = $convert.base64Decode(
    'CghEb2N1bWVudBIOCgJpZBgBIAEoCVICaWQSJwoGc291cmNlGAIgASgLMg8uc2NyaWJlLnYxLk'
    'pzb25SBnNvdXJjZQ==');

@$core.Deprecated('Use addRequestDescriptor instead')
const AddRequest$json = {
  '1': 'AddRequest',
  '2': [
    {'1': 'entity', '3': 1, '4': 1, '5': 9, '10': 'entity'},
    {
      '1': 'documents',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.searcher.v1.Document',
      '10': 'documents'
    },
    {'1': 'refresh', '3': 3, '4': 1, '5': 8, '10': 'refresh'},
  ],
};

/// Descriptor for `AddRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List addRequestDescriptor = $convert.base64Decode(
    'CgpBZGRSZXF1ZXN0EhYKBmVudGl0eRgBIAEoCVIGZW50aXR5EkIKCWRvY3VtZW50cxgCIAMoCz'
    'IkLnNjcmliZS5jbGllbnRzLnNlYXJjaGVyLnYxLkRvY3VtZW50Uglkb2N1bWVudHMSGAoHcmVm'
    'cmVzaBgDIAEoCFIHcmVmcmVzaA==');

@$core.Deprecated('Use addResultDescriptor instead')
const AddResult$json = {
  '1': 'AddResult',
  '2': [
    {'1': 'indexed', '3': 1, '4': 1, '5': 13, '10': 'indexed'},
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

/// Descriptor for `AddResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List addResultDescriptor = $convert.base64Decode(
    'CglBZGRSZXN1bHQSGAoHaW5kZXhlZBgBIAEoDVIHaW5kZXhlZBIoCgVlcnJvchgCIAEoCzISLn'
    'NjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use deleteRequestDescriptor instead')
const DeleteRequest$json = {
  '1': 'DeleteRequest',
  '2': [
    {'1': 'entity', '3': 1, '4': 1, '5': 9, '10': 'entity'},
    {'1': 'ids', '3': 2, '4': 3, '5': 9, '10': 'ids'},
  ],
};

/// Descriptor for `DeleteRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteRequestDescriptor = $convert.base64Decode(
    'Cg1EZWxldGVSZXF1ZXN0EhYKBmVudGl0eRgBIAEoCVIGZW50aXR5EhAKA2lkcxgCIAMoCVIDaW'
    'Rz');

@$core.Deprecated('Use deleteResultDescriptor instead')
const DeleteResult$json = {
  '1': 'DeleteResult',
  '2': [
    {'1': 'deleted', '3': 1, '4': 1, '5': 13, '10': 'deleted'},
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

/// Descriptor for `DeleteResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteResultDescriptor = $convert.base64Decode(
    'CgxEZWxldGVSZXN1bHQSGAoHZGVsZXRlZBgBIAEoDVIHZGVsZXRlZBIoCgVlcnJvchgCIAEoCz'
    'ISLnNjcmliZS52MS5GYWlsdXJlUgVlcnJvcg==');

@$core.Deprecated('Use geoDistanceDescriptor instead')
const GeoDistance$json = {
  '1': 'GeoDistance',
  '2': [
    {'1': 'lat', '3': 1, '4': 1, '5': 1, '10': 'lat'},
    {'1': 'lng', '3': 2, '4': 1, '5': 1, '10': 'lng'},
    {'1': 'radius_meters', '3': 3, '4': 1, '5': 1, '10': 'radiusMeters'},
  ],
};

/// Descriptor for `GeoDistance`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List geoDistanceDescriptor = $convert.base64Decode(
    'CgtHZW9EaXN0YW5jZRIQCgNsYXQYASABKAFSA2xhdBIQCgNsbmcYAiABKAFSA2xuZxIjCg1yYW'
    'RpdXNfbWV0ZXJzGAMgASgBUgxyYWRpdXNNZXRlcnM=');

@$core.Deprecated('Use sortDescriptor instead')
const Sort$json = {
  '1': 'Sort',
  '2': [
    {'1': 'field', '3': 1, '4': 1, '5': 9, '10': 'field'},
    {'1': 'descending', '3': 2, '4': 1, '5': 8, '10': 'descending'},
    {
      '1': 'geo',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.searcher.v1.GeoDistance',
      '10': 'geo'
    },
  ],
};

/// Descriptor for `Sort`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List sortDescriptor = $convert.base64Decode(
    'CgRTb3J0EhQKBWZpZWxkGAEgASgJUgVmaWVsZBIeCgpkZXNjZW5kaW5nGAIgASgIUgpkZXNjZW'
    '5kaW5nEjkKA2dlbxgDIAEoCzInLnNjcmliZS5jbGllbnRzLnNlYXJjaGVyLnYxLkdlb0Rpc3Rh'
    'bmNlUgNnZW8=');

@$core.Deprecated('Use searchRequestDescriptor instead')
const SearchRequest$json = {
  '1': 'SearchRequest',
  '2': [
    {'1': 'entity', '3': 1, '4': 1, '5': 9, '10': 'entity'},
    {
      '1': 'query',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'query'
    },
    {'1': 'fields', '3': 3, '4': 3, '5': 9, '10': 'fields'},
    {
      '1': 'sort',
      '3': 4,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.searcher.v1.Sort',
      '10': 'sort'
    },
    {'1': 'limit', '3': 5, '4': 1, '5': 13, '10': 'limit'},
    {'1': 'offset', '3': 6, '4': 1, '5': 13, '10': 'offset'},
    {'1': 'cache_key', '3': 7, '4': 1, '5': 9, '10': 'cacheKey'},
  ],
};

/// Descriptor for `SearchRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List searchRequestDescriptor = $convert.base64Decode(
    'Cg1TZWFyY2hSZXF1ZXN0EhYKBmVudGl0eRgBIAEoCVIGZW50aXR5EiUKBXF1ZXJ5GAIgASgLMg'
    '8uc2NyaWJlLnYxLkpzb25SBXF1ZXJ5EhYKBmZpZWxkcxgDIAMoCVIGZmllbGRzEjQKBHNvcnQY'
    'BCADKAsyIC5zY3JpYmUuY2xpZW50cy5zZWFyY2hlci52MS5Tb3J0UgRzb3J0EhQKBWxpbWl0GA'
    'UgASgNUgVsaW1pdBIWCgZvZmZzZXQYBiABKA1SBm9mZnNldBIbCgljYWNoZV9rZXkYByABKAlS'
    'CGNhY2hlS2V5');

@$core.Deprecated('Use searchHitDescriptor instead')
const SearchHit$json = {
  '1': 'SearchHit',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {'1': 'score', '3': 2, '4': 1, '5': 1, '10': 'score'},
    {
      '1': 'source',
      '3': 3,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'source'
    },
  ],
};

/// Descriptor for `SearchHit`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List searchHitDescriptor = $convert.base64Decode(
    'CglTZWFyY2hIaXQSDgoCaWQYASABKAlSAmlkEhQKBXNjb3JlGAIgASgBUgVzY29yZRInCgZzb3'
    'VyY2UYAyABKAsyDy5zY3JpYmUudjEuSnNvblIGc291cmNl');

@$core.Deprecated('Use searchResultDescriptor instead')
const SearchResult$json = {
  '1': 'SearchResult',
  '2': [
    {
      '1': 'hits',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.searcher.v1.SearchHit',
      '10': 'hits'
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

/// Descriptor for `SearchResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List searchResultDescriptor = $convert.base64Decode(
    'CgxTZWFyY2hSZXN1bHQSOQoEaGl0cxgBIAMoCzIlLnNjcmliZS5jbGllbnRzLnNlYXJjaGVyLn'
    'YxLlNlYXJjaEhpdFIEaGl0cxIUCgV0b3RhbBgCIAEoBFIFdG90YWwSKAoFZXJyb3IYAyABKAsy'
    'Ei5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> SearcherServiceBase$json = {
  '1': 'Searcher',
  '2': [
    {
      '1': 'Add',
      '2': '.scribe.clients.searcher.v1.AddRequest',
      '3': '.scribe.clients.searcher.v1.AddResult'
    },
    {
      '1': 'Delete',
      '2': '.scribe.clients.searcher.v1.DeleteRequest',
      '3': '.scribe.clients.searcher.v1.DeleteResult'
    },
    {
      '1': 'Search',
      '2': '.scribe.clients.searcher.v1.SearchRequest',
      '3': '.scribe.clients.searcher.v1.SearchResult'
    },
  ],
};

@$core.Deprecated('Use searcherServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    SearcherServiceBase$messageJson = {
  '.scribe.clients.searcher.v1.AddRequest': AddRequest$json,
  '.scribe.clients.searcher.v1.Document': Document$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.searcher.v1.AddResult': AddResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.searcher.v1.DeleteRequest': DeleteRequest$json,
  '.scribe.clients.searcher.v1.DeleteResult': DeleteResult$json,
  '.scribe.clients.searcher.v1.SearchRequest': SearchRequest$json,
  '.scribe.clients.searcher.v1.Sort': Sort$json,
  '.scribe.clients.searcher.v1.GeoDistance': GeoDistance$json,
  '.scribe.clients.searcher.v1.SearchResult': SearchResult$json,
  '.scribe.clients.searcher.v1.SearchHit': SearchHit$json,
};

/// Descriptor for `Searcher`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List searcherServiceDescriptor = $convert.base64Decode(
    'CghTZWFyY2hlchJUCgNBZGQSJi5zY3JpYmUuY2xpZW50cy5zZWFyY2hlci52MS5BZGRSZXF1ZX'
    'N0GiUuc2NyaWJlLmNsaWVudHMuc2VhcmNoZXIudjEuQWRkUmVzdWx0El0KBkRlbGV0ZRIpLnNj'
    'cmliZS5jbGllbnRzLnNlYXJjaGVyLnYxLkRlbGV0ZVJlcXVlc3QaKC5zY3JpYmUuY2xpZW50cy'
    '5zZWFyY2hlci52MS5EZWxldGVSZXN1bHQSXQoGU2VhcmNoEikuc2NyaWJlLmNsaWVudHMuc2Vh'
    'cmNoZXIudjEuU2VhcmNoUmVxdWVzdBooLnNjcmliZS5jbGllbnRzLnNlYXJjaGVyLnYxLlNlYX'
    'JjaFJlc3VsdA==');
