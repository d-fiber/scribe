// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/searcher/protocol/searcher.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'searcher.pb.dart' as $1;
import 'searcher.pbjson.dart';

export 'searcher.pb.dart';

abstract class SearcherServiceBase extends $pb.GeneratedService {
  $async.Future<$1.AddResult> add($pb.ServerContext ctx, $1.AddRequest request);
  $async.Future<$1.DeleteResult> delete(
      $pb.ServerContext ctx, $1.DeleteRequest request);
  $async.Future<$1.SearchResult> search(
      $pb.ServerContext ctx, $1.SearchRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Add':
        return $1.AddRequest();
      case 'Delete':
        return $1.DeleteRequest();
      case 'Search':
        return $1.SearchRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Add':
        return add(ctx, request as $1.AddRequest);
      case 'Delete':
        return delete(ctx, request as $1.DeleteRequest);
      case 'Search':
        return search(ctx, request as $1.SearchRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => SearcherServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => SearcherServiceBase$messageJson;
}
