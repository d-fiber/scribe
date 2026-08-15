// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/recommendation/protocol/recommendation.proto.

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

@$core.Deprecated('Use userDescriptor instead')
const User$json = {
  '1': 'User',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {
      '1': 'labels',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'labels'
    },
    {'1': 'comment', '3': 3, '4': 1, '5': 9, '10': 'comment'},
  ],
};

/// Descriptor for `User`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List userDescriptor = $convert.base64Decode(
    'CgRVc2VyEg4KAmlkGAEgASgJUgJpZBInCgZsYWJlbHMYAiABKAsyDy5zY3JpYmUudjEuSnNvbl'
    'IGbGFiZWxzEhgKB2NvbW1lbnQYAyABKAlSB2NvbW1lbnQ=');

@$core.Deprecated('Use itemDescriptor instead')
const Item$json = {
  '1': 'Item',
  '2': [
    {'1': 'id', '3': 1, '4': 1, '5': 9, '10': 'id'},
    {
      '1': 'labels',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Json',
      '10': 'labels'
    },
    {'1': 'comment', '3': 3, '4': 1, '5': 9, '10': 'comment'},
    {'1': 'categories', '3': 4, '4': 3, '5': 9, '10': 'categories'},
    {'1': 'is_hidden', '3': 5, '4': 1, '5': 8, '10': 'isHidden'},
    {'1': 'timestamp', '3': 6, '4': 1, '5': 9, '10': 'timestamp'},
  ],
};

/// Descriptor for `Item`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List itemDescriptor = $convert.base64Decode(
    'CgRJdGVtEg4KAmlkGAEgASgJUgJpZBInCgZsYWJlbHMYAiABKAsyDy5zY3JpYmUudjEuSnNvbl'
    'IGbGFiZWxzEhgKB2NvbW1lbnQYAyABKAlSB2NvbW1lbnQSHgoKY2F0ZWdvcmllcxgEIAMoCVIK'
    'Y2F0ZWdvcmllcxIbCglpc19oaWRkZW4YBSABKAhSCGlzSGlkZGVuEhwKCXRpbWVzdGFtcBgGIA'
    'EoCVIJdGltZXN0YW1w');

@$core.Deprecated('Use feedbackDescriptor instead')
const Feedback$json = {
  '1': 'Feedback',
  '2': [
    {'1': 'type', '3': 1, '4': 1, '5': 9, '10': 'type'},
    {'1': 'user_id', '3': 2, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'item_id', '3': 3, '4': 1, '5': 9, '10': 'itemId'},
    {'1': 'value', '3': 4, '4': 1, '5': 1, '10': 'value'},
    {'1': 'timestamp', '3': 5, '4': 1, '5': 9, '10': 'timestamp'},
  ],
};

/// Descriptor for `Feedback`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List feedbackDescriptor = $convert.base64Decode(
    'CghGZWVkYmFjaxISCgR0eXBlGAEgASgJUgR0eXBlEhcKB3VzZXJfaWQYAiABKAlSBnVzZXJJZB'
    'IXCgdpdGVtX2lkGAMgASgJUgZpdGVtSWQSFAoFdmFsdWUYBCABKAFSBXZhbHVlEhwKCXRpbWVz'
    'dGFtcBgFIAEoCVIJdGltZXN0YW1w');

@$core.Deprecated('Use upsertUserRequestDescriptor instead')
const UpsertUserRequest$json = {
  '1': 'UpsertUserRequest',
  '2': [
    {
      '1': 'user',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.recommendation.v1.User',
      '10': 'user'
    },
  ],
};

/// Descriptor for `UpsertUserRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List upsertUserRequestDescriptor = $convert.base64Decode(
    'ChFVcHNlcnRVc2VyUmVxdWVzdBI6CgR1c2VyGAEgASgLMiYuc2NyaWJlLmNsaWVudHMucmVjb2'
    '1tZW5kYXRpb24udjEuVXNlclIEdXNlcg==');

@$core.Deprecated('Use upsertItemRequestDescriptor instead')
const UpsertItemRequest$json = {
  '1': 'UpsertItemRequest',
  '2': [
    {
      '1': 'item',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.recommendation.v1.Item',
      '10': 'item'
    },
  ],
};

/// Descriptor for `UpsertItemRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List upsertItemRequestDescriptor = $convert.base64Decode(
    'ChFVcHNlcnRJdGVtUmVxdWVzdBI6CgRpdGVtGAEgASgLMiYuc2NyaWJlLmNsaWVudHMucmVjb2'
    '1tZW5kYXRpb24udjEuSXRlbVIEaXRlbQ==');

@$core.Deprecated('Use deleteUserRequestDescriptor instead')
const DeleteUserRequest$json = {
  '1': 'DeleteUserRequest',
  '2': [
    {'1': 'user_id', '3': 1, '4': 1, '5': 9, '10': 'userId'},
  ],
};

/// Descriptor for `DeleteUserRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteUserRequestDescriptor = $convert.base64Decode(
    'ChFEZWxldGVVc2VyUmVxdWVzdBIXCgd1c2VyX2lkGAEgASgJUgZ1c2VySWQ=');

@$core.Deprecated('Use deleteItemRequestDescriptor instead')
const DeleteItemRequest$json = {
  '1': 'DeleteItemRequest',
  '2': [
    {'1': 'item_id', '3': 1, '4': 1, '5': 9, '10': 'itemId'},
  ],
};

/// Descriptor for `DeleteItemRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteItemRequestDescriptor = $convert.base64Decode(
    'ChFEZWxldGVJdGVtUmVxdWVzdBIXCgdpdGVtX2lkGAEgASgJUgZpdGVtSWQ=');

@$core.Deprecated('Use insertFeedbackRequestDescriptor instead')
const InsertFeedbackRequest$json = {
  '1': 'InsertFeedbackRequest',
  '2': [
    {
      '1': 'feedback',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.recommendation.v1.Feedback',
      '10': 'feedback'
    },
  ],
};

/// Descriptor for `InsertFeedbackRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List insertFeedbackRequestDescriptor = $convert.base64Decode(
    'ChVJbnNlcnRGZWVkYmFja1JlcXVlc3QSRgoIZmVlZGJhY2sYASADKAsyKi5zY3JpYmUuY2xpZW'
    '50cy5yZWNvbW1lbmRhdGlvbi52MS5GZWVkYmFja1IIZmVlZGJhY2s=');

@$core.Deprecated('Use recommendRequestDescriptor instead')
const RecommendRequest$json = {
  '1': 'RecommendRequest',
  '2': [
    {'1': 'user_id', '3': 1, '4': 1, '5': 9, '10': 'userId'},
    {'1': 'count', '3': 2, '4': 1, '5': 13, '10': 'count'},
    {'1': 'category', '3': 3, '4': 1, '5': 9, '10': 'category'},
    {'1': 'offset', '3': 4, '4': 1, '5': 13, '10': 'offset'},
  ],
};

/// Descriptor for `RecommendRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List recommendRequestDescriptor = $convert.base64Decode(
    'ChBSZWNvbW1lbmRSZXF1ZXN0EhcKB3VzZXJfaWQYASABKAlSBnVzZXJJZBIUCgVjb3VudBgCIA'
    'EoDVIFY291bnQSGgoIY2F0ZWdvcnkYAyABKAlSCGNhdGVnb3J5EhYKBm9mZnNldBgEIAEoDVIG'
    'b2Zmc2V0');

@$core.Deprecated('Use recommendResultDescriptor instead')
const RecommendResult$json = {
  '1': 'RecommendResult',
  '2': [
    {'1': 'item_ids', '3': 1, '4': 3, '5': 9, '10': 'itemIds'},
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

/// Descriptor for `RecommendResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List recommendResultDescriptor = $convert.base64Decode(
    'Cg9SZWNvbW1lbmRSZXN1bHQSGQoIaXRlbV9pZHMYASADKAlSB2l0ZW1JZHMSKAoFZXJyb3IYAi'
    'ABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

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

const $core.Map<$core.String, $core.dynamic> RecommendationServiceBase$json = {
  '1': 'Recommendation',
  '2': [
    {
      '1': 'UpsertUser',
      '2': '.scribe.clients.recommendation.v1.UpsertUserRequest',
      '3': '.scribe.clients.recommendation.v1.VoidResult'
    },
    {
      '1': 'UpsertItem',
      '2': '.scribe.clients.recommendation.v1.UpsertItemRequest',
      '3': '.scribe.clients.recommendation.v1.VoidResult'
    },
    {
      '1': 'DeleteUser',
      '2': '.scribe.clients.recommendation.v1.DeleteUserRequest',
      '3': '.scribe.clients.recommendation.v1.VoidResult'
    },
    {
      '1': 'DeleteItem',
      '2': '.scribe.clients.recommendation.v1.DeleteItemRequest',
      '3': '.scribe.clients.recommendation.v1.VoidResult'
    },
    {
      '1': 'InsertFeedback',
      '2': '.scribe.clients.recommendation.v1.InsertFeedbackRequest',
      '3': '.scribe.clients.recommendation.v1.VoidResult'
    },
    {
      '1': 'Recommend',
      '2': '.scribe.clients.recommendation.v1.RecommendRequest',
      '3': '.scribe.clients.recommendation.v1.RecommendResult'
    },
  ],
};

@$core.Deprecated('Use recommendationServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    RecommendationServiceBase$messageJson = {
  '.scribe.clients.recommendation.v1.UpsertUserRequest': UpsertUserRequest$json,
  '.scribe.clients.recommendation.v1.User': User$json,
  '.scribe.v1.Json': $0.Json$json,
  '.scribe.clients.recommendation.v1.VoidResult': VoidResult$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.recommendation.v1.UpsertItemRequest': UpsertItemRequest$json,
  '.scribe.clients.recommendation.v1.Item': Item$json,
  '.scribe.clients.recommendation.v1.DeleteUserRequest': DeleteUserRequest$json,
  '.scribe.clients.recommendation.v1.DeleteItemRequest': DeleteItemRequest$json,
  '.scribe.clients.recommendation.v1.InsertFeedbackRequest':
      InsertFeedbackRequest$json,
  '.scribe.clients.recommendation.v1.Feedback': Feedback$json,
  '.scribe.clients.recommendation.v1.RecommendRequest': RecommendRequest$json,
  '.scribe.clients.recommendation.v1.RecommendResult': RecommendResult$json,
};

/// Descriptor for `Recommendation`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List recommendationServiceDescriptor = $convert.base64Decode(
    'Cg5SZWNvbW1lbmRhdGlvbhJvCgpVcHNlcnRVc2VyEjMuc2NyaWJlLmNsaWVudHMucmVjb21tZW'
    '5kYXRpb24udjEuVXBzZXJ0VXNlclJlcXVlc3QaLC5zY3JpYmUuY2xpZW50cy5yZWNvbW1lbmRh'
    'dGlvbi52MS5Wb2lkUmVzdWx0Em8KClVwc2VydEl0ZW0SMy5zY3JpYmUuY2xpZW50cy5yZWNvbW'
    '1lbmRhdGlvbi52MS5VcHNlcnRJdGVtUmVxdWVzdBosLnNjcmliZS5jbGllbnRzLnJlY29tbWVu'
    'ZGF0aW9uLnYxLlZvaWRSZXN1bHQSbwoKRGVsZXRlVXNlchIzLnNjcmliZS5jbGllbnRzLnJlY2'
    '9tbWVuZGF0aW9uLnYxLkRlbGV0ZVVzZXJSZXF1ZXN0Giwuc2NyaWJlLmNsaWVudHMucmVjb21t'
    'ZW5kYXRpb24udjEuVm9pZFJlc3VsdBJvCgpEZWxldGVJdGVtEjMuc2NyaWJlLmNsaWVudHMucm'
    'Vjb21tZW5kYXRpb24udjEuRGVsZXRlSXRlbVJlcXVlc3QaLC5zY3JpYmUuY2xpZW50cy5yZWNv'
    'bW1lbmRhdGlvbi52MS5Wb2lkUmVzdWx0EncKDkluc2VydEZlZWRiYWNrEjcuc2NyaWJlLmNsaW'
    'VudHMucmVjb21tZW5kYXRpb24udjEuSW5zZXJ0RmVlZGJhY2tSZXF1ZXN0Giwuc2NyaWJlLmNs'
    'aWVudHMucmVjb21tZW5kYXRpb24udjEuVm9pZFJlc3VsdBJyCglSZWNvbW1lbmQSMi5zY3JpYm'
    'UuY2xpZW50cy5yZWNvbW1lbmRhdGlvbi52MS5SZWNvbW1lbmRSZXF1ZXN0GjEuc2NyaWJlLmNs'
    'aWVudHMucmVjb21tZW5kYXRpb24udjEuUmVjb21tZW5kUmVzdWx0');
