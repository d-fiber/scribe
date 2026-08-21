// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/storage/protocol/storage.proto.

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

@$core.Deprecated('Use objectRefDescriptor instead')
const ObjectRef$json = {
  '1': 'ObjectRef',
  '2': [
    {'1': 'folder', '3': 1, '4': 1, '5': 9, '10': 'folder'},
    {
      '1': 'path_args',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.storage.v1.ObjectRef.PathArgsEntry',
      '10': 'pathArgs'
    },
    {'1': 'filename', '3': 3, '4': 1, '5': 9, '10': 'filename'},
  ],
  '3': [ObjectRef_PathArgsEntry$json],
};

@$core.Deprecated('Use objectRefDescriptor instead')
const ObjectRef_PathArgsEntry$json = {
  '1': 'PathArgsEntry',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'value', '3': 2, '4': 1, '5': 9, '10': 'value'},
  ],
  '7': {'7': true},
};

/// Descriptor for `ObjectRef`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List objectRefDescriptor = $convert.base64Decode(
    'CglPYmplY3RSZWYSFgoGZm9sZGVyGAEgASgJUgZmb2xkZXISTwoJcGF0aF9hcmdzGAIgAygLMj'
    'Iuc2NyaWJlLmNsaWVudHMuc3RvcmFnZS52MS5PYmplY3RSZWYuUGF0aEFyZ3NFbnRyeVIIcGF0'
    'aEFyZ3MSGgoIZmlsZW5hbWUYAyABKAlSCGZpbGVuYW1lGjsKDVBhdGhBcmdzRW50cnkSEAoDa2'
    'V5GAEgASgJUgNrZXkSFAoFdmFsdWUYAiABKAlSBXZhbHVlOgI4AQ==');

@$core.Deprecated('Use uploadRequestDescriptor instead')
const UploadRequest$json = {
  '1': 'UploadRequest',
  '2': [
    {
      '1': 'object',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.storage.v1.ObjectRef',
      '10': 'object'
    },
    {'1': 'content', '3': 2, '4': 1, '5': 12, '10': 'content'},
    {'1': 'mime_type', '3': 3, '4': 1, '5': 9, '10': 'mimeType'},
    {'1': 'upsert', '3': 4, '4': 1, '5': 8, '10': 'upsert'},
  ],
};

/// Descriptor for `UploadRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List uploadRequestDescriptor = $convert.base64Decode(
    'Cg1VcGxvYWRSZXF1ZXN0EjwKBm9iamVjdBgBIAEoCzIkLnNjcmliZS5jbGllbnRzLnN0b3JhZ2'
    'UudjEuT2JqZWN0UmVmUgZvYmplY3QSGAoHY29udGVudBgCIAEoDFIHY29udGVudBIbCgltaW1l'
    'X3R5cGUYAyABKAlSCG1pbWVUeXBlEhYKBnVwc2VydBgEIAEoCFIGdXBzZXJ0');

@$core.Deprecated('Use uploadResultDescriptor instead')
const UploadResult$json = {
  '1': 'UploadResult',
  '2': [
    {'1': 'path', '3': 1, '4': 1, '5': 9, '10': 'path'},
    {
      '1': 'size',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Size',
      '10': 'size'
    },
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

/// Descriptor for `UploadResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List uploadResultDescriptor = $convert.base64Decode(
    'CgxVcGxvYWRSZXN1bHQSEgoEcGF0aBgBIAEoCVIEcGF0aBIjCgRzaXplGAIgASgLMg8uc2NyaW'
    'JlLnYxLlNpemVSBHNpemUSKAoFZXJyb3IYAyABKAsyEi5zY3JpYmUudjEuRmFpbHVyZVIFZXJy'
    'b3I=');

@$core.Deprecated('Use deleteRequestDescriptor instead')
const DeleteRequest$json = {
  '1': 'DeleteRequest',
  '2': [
    {
      '1': 'objects',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.storage.v1.ObjectRef',
      '10': 'objects'
    },
  ],
};

/// Descriptor for `DeleteRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List deleteRequestDescriptor = $convert.base64Decode(
    'Cg1EZWxldGVSZXF1ZXN0Ej4KB29iamVjdHMYASADKAsyJC5zY3JpYmUuY2xpZW50cy5zdG9yYW'
    'dlLnYxLk9iamVjdFJlZlIHb2JqZWN0cw==');

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

@$core.Deprecated('Use signedUrlRequestDescriptor instead')
const SignedUrlRequest$json = {
  '1': 'SignedUrlRequest',
  '2': [
    {
      '1': 'object',
      '3': 1,
      '4': 1,
      '5': 11,
      '6': '.scribe.clients.storage.v1.ObjectRef',
      '10': 'object'
    },
    {
      '1': 'expires_in',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Time',
      '10': 'expiresIn'
    },
  ],
};

/// Descriptor for `SignedUrlRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List signedUrlRequestDescriptor = $convert.base64Decode(
    'ChBTaWduZWRVcmxSZXF1ZXN0EjwKBm9iamVjdBgBIAEoCzIkLnNjcmliZS5jbGllbnRzLnN0b3'
    'JhZ2UudjEuT2JqZWN0UmVmUgZvYmplY3QSLgoKZXhwaXJlc19pbhgCIAEoCzIPLnNjcmliZS52'
    'MS5UaW1lUglleHBpcmVzSW4=');

@$core.Deprecated('Use signedUrlResultDescriptor instead')
const SignedUrlResult$json = {
  '1': 'SignedUrlResult',
  '2': [
    {'1': 'url', '3': 1, '4': 1, '5': 9, '10': 'url'},
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

/// Descriptor for `SignedUrlResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List signedUrlResultDescriptor = $convert.base64Decode(
    'Cg9TaWduZWRVcmxSZXN1bHQSEAoDdXJsGAEgASgJUgN1cmwSKAoFZXJyb3IYAiABKAsyEi5zY3'
    'JpYmUudjEuRmFpbHVyZVIFZXJyb3I=');

@$core.Deprecated('Use listRequestDescriptor instead')
const ListRequest$json = {
  '1': 'ListRequest',
  '2': [
    {'1': 'folder', '3': 1, '4': 1, '5': 9, '10': 'folder'},
    {
      '1': 'path_args',
      '3': 2,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.storage.v1.ListRequest.PathArgsEntry',
      '10': 'pathArgs'
    },
    {'1': 'limit', '3': 3, '4': 1, '5': 13, '10': 'limit'},
    {'1': 'offset', '3': 4, '4': 1, '5': 13, '10': 'offset'},
  ],
  '3': [ListRequest_PathArgsEntry$json],
};

@$core.Deprecated('Use listRequestDescriptor instead')
const ListRequest_PathArgsEntry$json = {
  '1': 'PathArgsEntry',
  '2': [
    {'1': 'key', '3': 1, '4': 1, '5': 9, '10': 'key'},
    {'1': 'value', '3': 2, '4': 1, '5': 9, '10': 'value'},
  ],
  '7': {'7': true},
};

/// Descriptor for `ListRequest`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List listRequestDescriptor = $convert.base64Decode(
    'CgtMaXN0UmVxdWVzdBIWCgZmb2xkZXIYASABKAlSBmZvbGRlchJRCglwYXRoX2FyZ3MYAiADKA'
    'syNC5zY3JpYmUuY2xpZW50cy5zdG9yYWdlLnYxLkxpc3RSZXF1ZXN0LlBhdGhBcmdzRW50cnlS'
    'CHBhdGhBcmdzEhQKBWxpbWl0GAMgASgNUgVsaW1pdBIWCgZvZmZzZXQYBCABKA1SBm9mZnNldB'
    'o7Cg1QYXRoQXJnc0VudHJ5EhAKA2tleRgBIAEoCVIDa2V5EhQKBXZhbHVlGAIgASgJUgV2YWx1'
    'ZToCOAE=');

@$core.Deprecated('Use objectSummaryDescriptor instead')
const ObjectSummary$json = {
  '1': 'ObjectSummary',
  '2': [
    {'1': 'path', '3': 1, '4': 1, '5': 9, '10': 'path'},
    {
      '1': 'size',
      '3': 2,
      '4': 1,
      '5': 11,
      '6': '.scribe.v1.Size',
      '10': 'size'
    },
    {'1': 'mime_type', '3': 3, '4': 1, '5': 9, '10': 'mimeType'},
    {'1': 'updated_at', '3': 4, '4': 1, '5': 3, '10': 'updatedAt'},
  ],
};

/// Descriptor for `ObjectSummary`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List objectSummaryDescriptor = $convert.base64Decode(
    'Cg1PYmplY3RTdW1tYXJ5EhIKBHBhdGgYASABKAlSBHBhdGgSIwoEc2l6ZRgCIAEoCzIPLnNjcm'
    'liZS52MS5TaXplUgRzaXplEhsKCW1pbWVfdHlwZRgDIAEoCVIIbWltZVR5cGUSHQoKdXBkYXRl'
    'ZF9hdBgEIAEoA1IJdXBkYXRlZEF0');

@$core.Deprecated('Use listResultDescriptor instead')
const ListResult$json = {
  '1': 'ListResult',
  '2': [
    {
      '1': 'objects',
      '3': 1,
      '4': 3,
      '5': 11,
      '6': '.scribe.clients.storage.v1.ObjectSummary',
      '10': 'objects'
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

/// Descriptor for `ListResult`. Decode as a `google.protobuf.DescriptorProto`.
final $typed_data.Uint8List listResultDescriptor = $convert.base64Decode(
    'CgpMaXN0UmVzdWx0EkIKB29iamVjdHMYASADKAsyKC5zY3JpYmUuY2xpZW50cy5zdG9yYWdlLn'
    'YxLk9iamVjdFN1bW1hcnlSB29iamVjdHMSKAoFZXJyb3IYAiABKAsyEi5zY3JpYmUudjEuRmFp'
    'bHVyZVIFZXJyb3I=');

const $core.Map<$core.String, $core.dynamic> StorageServiceBase$json = {
  '1': 'Storage',
  '2': [
    {
      '1': 'Upload',
      '2': '.scribe.clients.storage.v1.UploadRequest',
      '3': '.scribe.clients.storage.v1.UploadResult'
    },
    {
      '1': 'Delete',
      '2': '.scribe.clients.storage.v1.DeleteRequest',
      '3': '.scribe.clients.storage.v1.DeleteResult'
    },
    {
      '1': 'SignedUrl',
      '2': '.scribe.clients.storage.v1.SignedUrlRequest',
      '3': '.scribe.clients.storage.v1.SignedUrlResult'
    },
    {
      '1': 'List',
      '2': '.scribe.clients.storage.v1.ListRequest',
      '3': '.scribe.clients.storage.v1.ListResult'
    },
  ],
};

@$core.Deprecated('Use storageServiceDescriptor instead')
const $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
    StorageServiceBase$messageJson = {
  '.scribe.clients.storage.v1.UploadRequest': UploadRequest$json,
  '.scribe.clients.storage.v1.ObjectRef': ObjectRef$json,
  '.scribe.clients.storage.v1.ObjectRef.PathArgsEntry':
      ObjectRef_PathArgsEntry$json,
  '.scribe.clients.storage.v1.UploadResult': UploadResult$json,
  '.scribe.v1.Size': $0.Size$json,
  '.scribe.v1.Failure': $0.Failure$json,
  '.scribe.clients.storage.v1.DeleteRequest': DeleteRequest$json,
  '.scribe.clients.storage.v1.DeleteResult': DeleteResult$json,
  '.scribe.clients.storage.v1.SignedUrlRequest': SignedUrlRequest$json,
  '.scribe.v1.Time': $0.Time$json,
  '.scribe.clients.storage.v1.SignedUrlResult': SignedUrlResult$json,
  '.scribe.clients.storage.v1.ListRequest': ListRequest$json,
  '.scribe.clients.storage.v1.ListRequest.PathArgsEntry':
      ListRequest_PathArgsEntry$json,
  '.scribe.clients.storage.v1.ListResult': ListResult$json,
  '.scribe.clients.storage.v1.ObjectSummary': ObjectSummary$json,
};

/// Descriptor for `Storage`. Decode as a `google.protobuf.ServiceDescriptorProto`.
final $typed_data.Uint8List storageServiceDescriptor = $convert.base64Decode(
    'CgdTdG9yYWdlElsKBlVwbG9hZBIoLnNjcmliZS5jbGllbnRzLnN0b3JhZ2UudjEuVXBsb2FkUm'
    'VxdWVzdBonLnNjcmliZS5jbGllbnRzLnN0b3JhZ2UudjEuVXBsb2FkUmVzdWx0ElsKBkRlbGV0'
    'ZRIoLnNjcmliZS5jbGllbnRzLnN0b3JhZ2UudjEuRGVsZXRlUmVxdWVzdBonLnNjcmliZS5jbG'
    'llbnRzLnN0b3JhZ2UudjEuRGVsZXRlUmVzdWx0EmQKCVNpZ25lZFVybBIrLnNjcmliZS5jbGll'
    'bnRzLnN0b3JhZ2UudjEuU2lnbmVkVXJsUmVxdWVzdBoqLnNjcmliZS5jbGllbnRzLnN0b3JhZ2'
    'UudjEuU2lnbmVkVXJsUmVzdWx0ElUKBExpc3QSJi5zY3JpYmUuY2xpZW50cy5zdG9yYWdlLnYx'
    'Lkxpc3RSZXF1ZXN0GiUuc2NyaWJlLmNsaWVudHMuc3RvcmFnZS52MS5MaXN0UmVzdWx0');
