package com.weisong.backend.controller;


import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.Comment;
import com.weisong.backend.service.CommentService;
import com.weisong.backend.util.Result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "/comment")
public class CommentController {

    @Autowired
    CommentService commentService;

    @GetMapping(value = "/{articleUuid}")
    public Result getCommentByArticleUuid(@PathVariable("articleUuid")String articleUuid){
        return Result.success(commentService.getCommentByArticleUuid(articleUuid));
    }

    @UserLoginToken
    @PostMapping(value = "/addComment")
    public Result writeComment(@RequestBody Map<String ,String> map){
        Comment comment = new Comment();
        comment.setArticleUuid(map.get("articleUuid"));
        comment.setComment(map.get("comment"));
        SimpleDateFormat a=new SimpleDateFormat("yyyy-MM-dd HH:mm");
        comment.setCommentTime(a.format(new Date()));
        commentService.writeComment(comment);
        return Result.success();
    }
}
