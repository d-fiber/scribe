// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/database/storage/protocol/storage.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'storage.pb.dart' as $1;
import 'storage.pbjson.dart';

export 'storage.pb.dart';

abstract class StorageServiceBase extends $pb.GeneratedService {
  $async.Future<$1.UploadResult> upload(
      $pb.ServerContext ctx, $1.UploadRequest request);
  $async.Future<$1.DeleteResult> delete(
      $pb.ServerContext ctx, $1.DeleteRequest request);
  $async.Future<$1.SignedUrlResult> signedUrl(
      $pb.ServerContext ctx, $1.SignedUrlRequest request);
  $async.Future<$1.ListResult> list(
      $pb.ServerContext ctx, $1.ListRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Upload':
        return $1.UploadRequest();
      case 'Delete':
        return $1.DeleteRequest();
      case 'SignedUrl':
        return $1.SignedUrlRequest();
      case 'List':
        return $1.ListRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Upload':
        return upload(ctx, request as $1.UploadRequest);
      case 'Delete':
        return delete(ctx, request as $1.DeleteRequest);
      case 'SignedUrl':
        return signedUrl(ctx, request as $1.SignedUrlRequest);
      case 'List':
        return list(ctx, request as $1.ListRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => StorageServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => StorageServiceBase$messageJson;
}
